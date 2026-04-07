from __future__ import annotations

from typing import List, Dict
from fastapi import FastAPI
from pydantic import BaseModel, Field

try:
    from py3dbp import Packer, Bin, Item  # type: ignore
    PY3DBP_AVAILABLE = True
except Exception:
    PY3DBP_AVAILABLE = False

app = FastAPI(title="Traffic Packing Service", version="0.1.0")


class Material(BaseModel):
    id: str
    length: float
    width: float
    height: float
    weight: float
    qty: int = Field(ge=1)
    stackable: bool = False
    maxStack: int | None = None


class TrailerType(BaseModel):
    type: str
    L: float = Field(alias="l")
    W: float = Field(alias="w")
    H: float = Field(alias="h")
    maxWeight: float

    class Config:
        allow_population_by_field_name = True


class PlanRequest(BaseModel):
    materials: List[Material]
    trailers: List[TrailerType]
    allowRotation: bool = True
    allowStacking: bool = True


class TrailerItemPlan(BaseModel):
    materialId: str
    quantity: int
    stackCount: int


class Placement(BaseModel):
    materialId: str
    quantity: int
    stackCount: int
    x: float
    y: float
    z: float
    length: float
    width: float
    height: float
    weight: float


class TrailerPlan(BaseModel):
    trailerType: str
    trailerLength: float
    trailerWidth: float
    trailerHeight: float
    totalWeight: float
    items: List[TrailerItemPlan]
    placements: List[Placement] = []


class PlanResponse(BaseModel):
    recommendedTrailerType: str
    totalTrailers: int
    trailers: List[TrailerPlan]
    warnings: List[str] = []
    mode: str = "heuristic"


class _StackItem(BaseModel):
    material_id: str
    qty_in_stack: int
    stack_count: int
    length: float
    width: float
    height: float
    weight: float


@app.post("/optimize", response_model=PlanResponse)
def optimize_plan(payload: PlanRequest) -> PlanResponse:
    warnings: List[str] = []

    if not payload.materials:
        return PlanResponse(
            recommendedTrailerType="",
            totalTrailers=0,
            trailers=[],
            warnings=["No materials."],
            mode="heuristic",
        )
    if not payload.trailers:
        return PlanResponse(
            recommendedTrailerType="",
            totalTrailers=0,
            trailers=[],
            warnings=["No trailers."],
            mode="heuristic",
        )

    trailers_sorted = sorted(payload.trailers, key=lambda t: t.L * t.W * t.H)

    best_plan: PlanResponse | None = None

    for trailer in trailers_sorted:
        plan = _plan_for_trailer(payload, trailer, warnings)
        if plan is None:
            continue
        if best_plan is None:
            best_plan = plan
        else:
            if plan.totalTrailers < best_plan.totalTrailers:
                best_plan = plan
            elif plan.totalTrailers == best_plan.totalTrailers:
                if _total_weight(plan) < _total_weight(best_plan):
                    best_plan = plan

    if best_plan is None:
        return PlanResponse(
            recommendedTrailerType="",
            totalTrailers=0,
            trailers=[],
            warnings=warnings + ["No trailer type can fit one or more materials."],
            mode="heuristic",
        )

    return best_plan


def _plan_for_trailer(payload: PlanRequest, trailer: TrailerType, warnings: List[str]) -> PlanResponse | None:
    stack_items, rejected = _expand_stacks(payload.materials, trailer, payload.allowStacking)
    if rejected:
        warnings.extend(rejected)

    if not stack_items:
        return None

    if PY3DBP_AVAILABLE:
        trailers = _pack_with_py3dbp(stack_items, trailer, payload.allowRotation)
        mode = "py3dbp"
    else:
        trailers = _pack_heuristic(stack_items, trailer)
        mode = "heuristic"

    if not trailers:
        return None

    return PlanResponse(
        recommendedTrailerType=trailer.type,
        totalTrailers=len(trailers),
        trailers=trailers,
        warnings=warnings,
        mode=mode,
    )


def _expand_stacks(materials: List[Material], trailer: TrailerType, allow_stacking: bool) -> tuple[list[_StackItem], list[str]]:
    expanded: List[_StackItem] = []
    rejected: List[str] = []

    for mat in materials:
        if mat.length <= 0 or mat.width <= 0 or mat.height <= 0 or mat.weight <= 0 or mat.qty <= 0:
            rejected.append(f"Material {mat.id} has invalid dimensions/weight/qty.")
            continue

        max_stack = 1
        if allow_stacking and mat.stackable:
            allowed = mat.maxStack if mat.maxStack and mat.maxStack > 0 else 99
            max_stack = int(min(allowed, max(int(trailer.H // mat.height), 1)))

        if mat.height * max_stack > trailer.H:
            max_stack = max(1, int(trailer.H // mat.height))

        if max_stack <= 0:
            rejected.append(f"Material {mat.id} cannot fit trailer height.")
            continue

        remaining = mat.qty
        while remaining > 0:
            stack_count = min(max_stack, remaining)
            expanded.append(
                _StackItem(
                    material_id=mat.id,
                    qty_in_stack=stack_count,
                    stack_count=stack_count,
                    length=mat.length,
                    width=mat.width,
                    height=mat.height * stack_count,
                    weight=mat.weight * stack_count,
                )
            )
            remaining -= stack_count

    return expanded, rejected


def _pack_with_py3dbp(items: List[_StackItem], trailer: TrailerType, allow_rotation: bool) -> List[TrailerPlan]:
    remaining = items[:]
    plans: List[TrailerPlan] = []

    while remaining:
        packer = Packer()
        packer.add_bin(Bin(trailer.type, trailer.L, trailer.W, trailer.H, trailer.maxWeight))

        item_map: Dict[str, _StackItem] = {}
        for idx, stack in enumerate(remaining):
            name = f"{stack.material_id}::{idx}"
            item_map[name] = stack
            item = Item(name, stack.length, stack.width, stack.height, stack.weight)
            if not allow_rotation:
                item.rotation_type = 0
            packer.add_item(item)

        packer.pack(distribute_items=False)

        fitted = packer.bins[0].items
        if not fitted:
            break

        used: Dict[str, TrailerItemPlan] = {}
        placements: List[Placement] = []
        total_weight = 0.0

        for item in fitted:
            stack = item_map.get(item.name)
            if not stack:
                continue
            key = stack.material_id
            total_weight += stack.weight
            if key not in used:
                used[key] = TrailerItemPlan(materialId=key, quantity=0, stackCount=stack.stack_count)
            used[key].quantity += stack.qty_in_stack

            placements.append(
                Placement(
                    materialId=key,
                    quantity=stack.qty_in_stack,
                    stackCount=stack.stack_count,
                    x=float(item.position[0]),
                    y=float(item.position[1]),
                    z=float(item.position[2]),
                    length=float(item.width),
                    width=float(item.height),
                    height=float(item.depth),
                    weight=float(stack.weight),
                )
            )

        plans.append(
            TrailerPlan(
                trailerType=trailer.type,
                trailerLength=trailer.L,
                trailerWidth=trailer.W,
                trailerHeight=trailer.H,
                totalWeight=round(total_weight, 2),
                items=list(used.values()),
                placements=placements,
            )
        )

        fitted_names = {item.name for item in fitted}
        remaining = [stack for idx, stack in enumerate(remaining) if f"{stack.material_id}::{idx}" not in fitted_names]

        if len(fitted_names) == 0:
            break

    return plans


def _pack_heuristic(items: List[_StackItem], trailer: TrailerType) -> List[TrailerPlan]:
    remaining = sorted(items, key=lambda x: x.length * x.width * x.height, reverse=True)
    plans: List[TrailerPlan] = []
    capacity_volume = trailer.L * trailer.W * trailer.H

    while remaining:
        used: Dict[str, TrailerItemPlan] = {}
        total_weight = 0.0
        total_volume = 0.0
        next_remaining: List[_StackItem] = []

        for stack in remaining:
            stack_volume = stack.length * stack.width * stack.height
            if total_weight + stack.weight <= trailer.maxWeight and total_volume + stack_volume <= capacity_volume:
                key = stack.material_id
                total_weight += stack.weight
                total_volume += stack_volume
                if key not in used:
                    used[key] = TrailerItemPlan(materialId=key, quantity=0, stackCount=stack.stack_count)
                used[key].quantity += stack.qty_in_stack
            else:
                next_remaining.append(stack)

        if not used:
            break

        plans.append(
            TrailerPlan(
                trailerType=trailer.type,
                trailerLength=trailer.L,
                trailerWidth=trailer.W,
                trailerHeight=trailer.H,
                totalWeight=round(total_weight, 2),
                items=list(used.values()),
                placements=[],
            )
        )
        remaining = next_remaining

    return plans


def _total_weight(plan: PlanResponse) -> float:
    return sum(trailer.totalWeight for trailer in plan.trailers)
