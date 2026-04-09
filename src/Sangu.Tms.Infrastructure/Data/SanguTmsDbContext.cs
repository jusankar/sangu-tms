using Microsoft.EntityFrameworkCore;

namespace Sangu.Tms.Infrastructure.Data;

public sealed class SanguTmsDbContext : DbContext
{
    public SanguTmsDbContext(DbContextOptions<SanguTmsDbContext> options) : base(options) { }

    public DbSet<BranchRecord> Branches => Set<BranchRecord>();
    public DbSet<LocationRecord> Locations => Set<LocationRecord>();
    public DbSet<CustomerRecord> Customers => Set<CustomerRecord>();
    public DbSet<ConsignmentRecord> Consignments => Set<ConsignmentRecord>();
    public DbSet<ChallanRecord> Challans => Set<ChallanRecord>();
    public DbSet<ChallanConsignmentRecord> ChallanConsignments => Set<ChallanConsignmentRecord>();
    public DbSet<LorryPaymentRecord> LorryPayments => Set<LorryPaymentRecord>();
    public DbSet<InvoiceRecord> Invoices => Set<InvoiceRecord>();
    public DbSet<InvoiceChallanRecord> InvoiceChallans => Set<InvoiceChallanRecord>();
    public DbSet<MoneyReceiptRecord> MoneyReceipts => Set<MoneyReceiptRecord>();
    public DbSet<DriverRecord> Drivers => Set<DriverRecord>();
    public DbSet<VehicleRecord> Vehicles => Set<VehicleRecord>();
    public DbSet<TrafficPlanRecord> TrafficPlans => Set<TrafficPlanRecord>();
    public DbSet<TrafficPlanTrailerRecord> TrafficPlanTrailers => Set<TrafficPlanTrailerRecord>();
    public DbSet<TrafficPlanItemRecord> TrafficPlanItems => Set<TrafficPlanItemRecord>();
    public DbSet<TrafficPlanPlacementRecord> TrafficPlanPlacements => Set<TrafficPlanPlacementRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("pgcrypto");

        modelBuilder.Entity<BranchRecord>(entity =>
        {
            entity.ToTable("branches");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Code).HasColumnName("code");
            entity.Property(x => x.Name).HasColumnName("name");
            entity.Property(x => x.Address).HasColumnName("address");
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        });

        modelBuilder.Entity<LocationRecord>(entity =>
        {
            entity.ToTable("locations");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Code).HasColumnName("code");
            entity.Property(x => x.Name).HasColumnName("name");
            entity.Property(x => x.StateName).HasColumnName("state_name");
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        });

        modelBuilder.Entity<CustomerRecord>(entity =>
        {
            entity.ToTable("customers");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Code).HasColumnName("code");
            entity.Property(x => x.Name).HasColumnName("name");
            entity.Property(x => x.Address).HasColumnName("address");
            entity.Property(x => x.GstNo).HasColumnName("gst_no");
            entity.Property(x => x.Mobile).HasColumnName("mobile");
            entity.Property(x => x.CreditDays).HasColumnName("credit_days");
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        });

        modelBuilder.Entity<ConsignmentRecord>(entity =>
        {
            entity.ToTable("consignments");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.BranchId).HasColumnName("branch_id");
            entity.Property(x => x.ConsignmentNo).HasColumnName("consignment_no");
            entity.Property(x => x.BookingDate).HasColumnName("booking_date");
            entity.Property(x => x.CustomerId).HasColumnName("customer_id");
            entity.Property(x => x.FromLocationId).HasColumnName("from_location_id");
            entity.Property(x => x.ToLocationId).HasColumnName("to_location_id");
            entity.Property(x => x.ConsignorName).HasColumnName("consignor_name");
            entity.Property(x => x.ConsignorAddress).HasColumnName("consignor_address");
            entity.Property(x => x.ConsigneeName).HasColumnName("consignee_name");
            entity.Property(x => x.ConsigneeAddress).HasColumnName("consignee_address");
            entity.Property(x => x.ConsignorGstNo).HasColumnName("consignor_gst_no");
            entity.Property(x => x.ConsigneeGstNo).HasColumnName("consignee_gst_no");
            entity.Property(x => x.DeliveryOfficeAddress).HasColumnName("delivery_office_address");
            entity.Property(x => x.GstPayableBy).HasColumnName("gst_payable_by");
            entity.Property(x => x.VehicleNo).HasColumnName("vehicle_no");
            entity.Property(x => x.PrivateMarkNo).HasColumnName("private_mark_no");
            entity.Property(x => x.Packages).HasColumnName("packages");
            entity.Property(x => x.GoodsDescription).HasColumnName("goods_description");
            entity.Property(x => x.Quantity).HasColumnName("quantity");
            entity.Property(x => x.WeightKg).HasColumnName("weight_kg");
            entity.Property(x => x.ActualWeight).HasColumnName("actual_weight");
            entity.Property(x => x.ChargedWeight).HasColumnName("charged_weight");
            entity.Property(x => x.RatePerQuintal).HasColumnName("rate_per_quintal");
            entity.Property(x => x.BasicFreight).HasColumnName("basic_freight");
            entity.Property(x => x.StCharge).HasColumnName("st_charge");
            entity.Property(x => x.GstAmount).HasColumnName("gst_amount");
            entity.Property(x => x.HamaliCharge).HasColumnName("hamali_charge");
            entity.Property(x => x.DoorDeliveryCharge).HasColumnName("door_delivery_charge");
            entity.Property(x => x.AdvancePaid).HasColumnName("advance_paid");
            entity.Property(x => x.CollectionCharge).HasColumnName("collection_charge");
            entity.Property(x => x.PaymentBasis).HasColumnName("payment_basis");
            entity.Property(x => x.PaymentAt).HasColumnName("payment_at");
            entity.Property(x => x.InvoiceNo).HasColumnName("invoice_no");
            entity.Property(x => x.InvoiceDate).HasColumnName("invoice_date");
            entity.Property(x => x.FreightAmount).HasColumnName("freight_amount");
            entity.Property(x => x.Status).HasColumnName("status");
            entity.Property(x => x.Remarks).HasColumnName("remarks");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.Property(x => x.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<ChallanRecord>(entity =>
        {
            entity.ToTable("challans");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.BranchId).HasColumnName("branch_id");
            entity.Property(x => x.ChallanNo).HasColumnName("challan_no");
            entity.Property(x => x.ChallanDate).HasColumnName("challan_date");
            entity.Property(x => x.FromLocationId).HasColumnName("from_location_id");
            entity.Property(x => x.ToLocationId).HasColumnName("to_location_id");
            entity.Property(x => x.DriverId).HasColumnName("driver_id");
            entity.Property(x => x.VehicleId).HasColumnName("vehicle_id");
            entity.Property(x => x.OwnerName).HasColumnName("owner_name");
            entity.Property(x => x.VehicleNo).HasColumnName("vehicle_no");
            entity.Property(x => x.DriverName).HasColumnName("driver_name");
            entity.Property(x => x.DriverLicenseNo).HasColumnName("driver_license_no");
            entity.Property(x => x.DriverMobile).HasColumnName("driver_mobile");
            entity.Property(x => x.BalanceAt).HasColumnName("balance_at");
            entity.Property(x => x.FreightAmount).HasColumnName("freight_amount");
            entity.Property(x => x.TotalHire).HasColumnName("total_hire");
            entity.Property(x => x.RefBalance).HasColumnName("ref_balance");
            entity.Property(x => x.AdvanceAmount).HasColumnName("advance_amount");
            entity.Property(x => x.PaidAmount).HasColumnName("paid_amount");
            entity.Property(x => x.Status).HasColumnName("status");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.Property(x => x.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<ChallanConsignmentRecord>(entity =>
        {
            entity.ToTable("challan_consignments");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ChallanId).HasColumnName("challan_id");
            entity.Property(x => x.ConsignmentId).HasColumnName("consignment_id");
            entity.Property(x => x.ConsignorName).HasColumnName("consignor_name");
            entity.Property(x => x.StationName).HasColumnName("station_name");
            entity.Property(x => x.Packages).HasColumnName("packages");
            entity.Property(x => x.LrNo).HasColumnName("lr_no");
            entity.Property(x => x.WeightKg).HasColumnName("weight_kg");
            entity.Property(x => x.Description).HasColumnName("description");
            entity.Property(x => x.FreightAmount).HasColumnName("freight_amount");
        });

        modelBuilder.Entity<LorryPaymentRecord>(entity =>
        {
            entity.ToTable("lorry_payments");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ChallanId).HasColumnName("challan_id");
            entity.Property(x => x.PaymentDate).HasColumnName("payment_date");
            entity.Property(x => x.PaymentType).HasColumnName("payment_type");
            entity.Property(x => x.Amount).HasColumnName("amount");
            entity.Property(x => x.Mode).HasColumnName("mode");
            entity.Property(x => x.ReferenceNo).HasColumnName("reference_no");
            entity.Property(x => x.Notes).HasColumnName("notes");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
        });

        modelBuilder.Entity<InvoiceRecord>(entity =>
        {
            entity.ToTable("invoices");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.BranchId).HasColumnName("branch_id");
            entity.Property(x => x.InvoiceNo).HasColumnName("invoice_no");
            entity.Property(x => x.InvoiceDate).HasColumnName("invoice_date");
            entity.Property(x => x.ConsignmentId).HasColumnName("consignment_id");
            entity.Property(x => x.TaxableAmount).HasColumnName("taxable_amount");
            entity.Property(x => x.GstAmount).HasColumnName("gst_amount");
            entity.Property(x => x.TotalAmount).HasColumnName("total_amount");
            entity.Property(x => x.ReceivedAmount).HasColumnName("received_amount");
            entity.Property(x => x.DueDate).HasColumnName("due_date");
            entity.Property(x => x.Status).HasColumnName("status");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.Property(x => x.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<InvoiceChallanRecord>(entity =>
        {
            entity.ToTable("invoice_challans");
            entity.HasKey(x => new { x.InvoiceId, x.ChallanId });
            entity.Property(x => x.InvoiceId).HasColumnName("invoice_id");
            entity.Property(x => x.ChallanId).HasColumnName("challan_id");
        });

        modelBuilder.Entity<MoneyReceiptRecord>(entity =>
        {
            entity.ToTable("money_receipts");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.BranchId).HasColumnName("branch_id");
            entity.Property(x => x.ReceiptNo).HasColumnName("receipt_no");
            entity.Property(x => x.ReceiptDate).HasColumnName("receipt_date");
            entity.Property(x => x.InvoiceId).HasColumnName("invoice_id");
            entity.Property(x => x.Amount).HasColumnName("amount");
            entity.Property(x => x.Mode).HasColumnName("mode");
            entity.Property(x => x.ReferenceNo).HasColumnName("reference_no");
            entity.Property(x => x.Status).HasColumnName("status");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
        });

        modelBuilder.Entity<DriverRecord>(entity =>
        {
            entity.ToTable("drivers");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Name).HasColumnName("name");
            entity.Property(x => x.LicenseNo).HasColumnName("license_no");
            entity.Property(x => x.DateOfBirth).HasColumnName("date_of_birth");
            entity.Property(x => x.Address).HasColumnName("address");
            entity.Property(x => x.BloodGroup).HasColumnName("blood_group");
            entity.Property(x => x.Mobile).HasColumnName("mobile");
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        });

        
        modelBuilder.Entity<TrafficPlanRecord>(entity =>
        {
            entity.ToTable("traffic_plans");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.RecommendedTrailerType).HasColumnName("recommended_trailer_type");
            entity.Property(x => x.TotalTrailers).HasColumnName("total_trailers");
            entity.Property(x => x.Mode).HasColumnName("mode");
            entity.Property(x => x.WarningsJson).HasColumnName("warnings_json").HasColumnType("jsonb");
            entity.Property(x => x.RequestJson).HasColumnName("request_json").HasColumnType("jsonb");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<TrafficPlanTrailerRecord>(entity =>
        {
            entity.ToTable("traffic_plan_trailers");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.PlanId).HasColumnName("plan_id");
            entity.Property(x => x.TrailerIndex).HasColumnName("trailer_index");
            entity.Property(x => x.TrailerType).HasColumnName("trailer_type");
            entity.Property(x => x.TotalWeight).HasColumnName("total_weight");
            entity.Property(x => x.TrailerLength).HasColumnName("trailer_length");
            entity.Property(x => x.TrailerWidth).HasColumnName("trailer_width");
            entity.Property(x => x.TrailerHeight).HasColumnName("trailer_height");
        });

        modelBuilder.Entity<TrafficPlanItemRecord>(entity =>
        {
            entity.ToTable("traffic_plan_items");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.TrailerId).HasColumnName("trailer_id");
            entity.Property(x => x.MaterialId).HasColumnName("material_id");
            entity.Property(x => x.Quantity).HasColumnName("quantity");
            entity.Property(x => x.StackCount).HasColumnName("stack_count");
        });

        modelBuilder.Entity<TrafficPlanPlacementRecord>(entity =>
        {
            entity.ToTable("traffic_plan_placements");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.TrailerId).HasColumnName("trailer_id");
            entity.Property(x => x.MaterialId).HasColumnName("material_id");
            entity.Property(x => x.Quantity).HasColumnName("quantity");
            entity.Property(x => x.StackCount).HasColumnName("stack_count");
            entity.Property(x => x.X).HasColumnName("x");
            entity.Property(x => x.Y).HasColumnName("y");
            entity.Property(x => x.Z).HasColumnName("z");
            entity.Property(x => x.Length).HasColumnName("length");
            entity.Property(x => x.Width).HasColumnName("width");
            entity.Property(x => x.Height).HasColumnName("height");
            entity.Property(x => x.Weight).HasColumnName("weight");
        });

        modelBuilder.Entity<VehicleRecord>(entity =>
        {
            entity.ToTable("vehicles");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.VehicleNumber).HasColumnName("vehicle_number");
            entity.Property(x => x.Make).HasColumnName("make");
            entity.Property(x => x.Type).HasColumnName("type");
            entity.Property(x => x.ChassisNumber).HasColumnName("chassis_number");
            entity.Property(x => x.EngineNumber).HasColumnName("engine_number");
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        });
    }
}

public sealed class BranchRecord
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
}

public sealed class LocationRecord
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? StateName { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
}

public sealed class CustomerRecord
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? GstNo { get; set; }
    public string? Mobile { get; set; }
    public int CreditDays { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
}

public sealed class ConsignmentRecord
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string ConsignmentNo { get; set; } = string.Empty;
    public DateOnly BookingDate { get; set; }
    public Guid CustomerId { get; set; }
    public Guid FromLocationId { get; set; }
    public Guid ToLocationId { get; set; }
    public string? ConsignorName { get; set; }
    public string? ConsignorAddress { get; set; }
    public string? ConsigneeName { get; set; }
    public string? ConsigneeAddress { get; set; }
    public string? ConsignorGstNo { get; set; }
    public string? ConsigneeGstNo { get; set; }
    public string? DeliveryOfficeAddress { get; set; }
    public string? GstPayableBy { get; set; }
    public string? VehicleNo { get; set; }
    public string? PrivateMarkNo { get; set; }
    public int Packages { get; set; }
    public string? GoodsDescription { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal ActualWeight { get; set; }
    public decimal ChargedWeight { get; set; }
    public decimal RatePerQuintal { get; set; }
    public decimal BasicFreight { get; set; }
    public decimal StCharge { get; set; }
    public decimal GstAmount { get; set; }
    public decimal HamaliCharge { get; set; }
    public decimal DoorDeliveryCharge { get; set; }
    public decimal AdvancePaid { get; set; }
    public decimal CollectionCharge { get; set; }
    public string? PaymentBasis { get; set; }
    public string? PaymentAt { get; set; }
    public string? InvoiceNo { get; set; }
    public DateOnly? InvoiceDate { get; set; }
    public decimal FreightAmount { get; set; }
    public string Status { get; set; } = "Draft";
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}

public sealed class ChallanRecord
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string ChallanNo { get; set; } = string.Empty;
    public DateOnly ChallanDate { get; set; }
    public Guid? FromLocationId { get; set; }
    public Guid? ToLocationId { get; set; }
    public Guid? DriverId { get; set; }
    public Guid? VehicleId { get; set; }
    public string? OwnerName { get; set; }
    public string? VehicleNo { get; set; }
    public string? DriverName { get; set; }
    public string? DriverLicenseNo { get; set; }
    public string? DriverMobile { get; set; }
    public string? BalanceAt { get; set; }
    public decimal FreightAmount { get; set; }
    public decimal TotalHire { get; set; }
    public decimal RefBalance { get; set; }
    public decimal AdvanceAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Status { get; set; } = "Open";
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}

public sealed class ChallanConsignmentRecord
{
    public Guid Id { get; set; }
    public Guid ChallanId { get; set; }
    public Guid? ConsignmentId { get; set; }
    public string? ConsignorName { get; set; }
    public string? StationName { get; set; }
    public int Packages { get; set; }
    public string? LrNo { get; set; }
    public decimal WeightKg { get; set; }
    public string? Description { get; set; }
    public decimal FreightAmount { get; set; }
}

public sealed class LorryPaymentRecord
{
    public Guid Id { get; set; }
    public Guid ChallanId { get; set; }
    public DateOnly PaymentDate { get; set; }
    public string PaymentType { get; set; } = "part";
    public decimal Amount { get; set; }
    public string Mode { get; set; } = "cash";
    public string? ReferenceNo { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
}

public sealed class InvoiceRecord
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public DateOnly InvoiceDate { get; set; }
    public Guid ConsignmentId { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal GstAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal ReceivedAmount { get; set; }
    public DateOnly? DueDate { get; set; }
    public string Status { get; set; } = "Draft";
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}

public sealed class InvoiceChallanRecord
{
    public Guid InvoiceId { get; set; }
    public Guid ChallanId { get; set; }
}

public sealed class MoneyReceiptRecord
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public string ReceiptNo { get; set; } = string.Empty;
    public Guid BranchId { get; set; }
    public DateOnly ReceiptDate { get; set; }
    public decimal Amount { get; set; }
    public string Mode { get; set; } = "cash";
    public string? ReferenceNo { get; set; }
    public string Status { get; set; } = "Posted";
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
}

public sealed class DriverRecord
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LicenseNo { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? BloodGroup { get; set; }
    public string? Mobile { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
}

public sealed class VehicleRecord
{
    public Guid Id { get; set; }
    public string VehicleNumber { get; set; } = string.Empty;
    public string? Make { get; set; }
    public string? Type { get; set; }
    public string? ChassisNumber { get; set; }
    public string? EngineNumber { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
}
public sealed class TrafficPlanRecord
{
    public Guid Id { get; set; }
    public string? RecommendedTrailerType { get; set; }
    public int TotalTrailers { get; set; }
    public string? Mode { get; set; }
    public string? WarningsJson { get; set; }
    public string? RequestJson { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class TrafficPlanTrailerRecord
{
    public Guid Id { get; set; }
    public Guid PlanId { get; set; }
    public int TrailerIndex { get; set; }
    public string? TrailerType { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal TrailerLength { get; set; }
    public decimal TrailerWidth { get; set; }
    public decimal TrailerHeight { get; set; }
}

public sealed class TrafficPlanItemRecord
{
    public Guid Id { get; set; }
    public Guid TrailerId { get; set; }
    public string MaterialId { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int StackCount { get; set; }
}










public sealed class TrafficPlanPlacementRecord
{
    public Guid Id { get; set; }
    public Guid TrailerId { get; set; }
    public string MaterialId { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int StackCount { get; set; }
    public decimal X { get; set; }
    public decimal Y { get; set; }
    public decimal Z { get; set; }
    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public decimal Height { get; set; }
    public decimal Weight { get; set; }
}
