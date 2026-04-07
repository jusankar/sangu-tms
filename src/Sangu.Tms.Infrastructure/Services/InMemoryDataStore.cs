using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Infrastructure.Services;

public sealed class InMemoryDataStore
{
    public InMemoryDataStore()
    {
        SeedPermissions();
    }

    public object SyncRoot { get; } = new();

    public List<ConsignmentViewModel> Consignments { get; } = new();
    public List<ChallanViewModel> Challans { get; } = new();
    public List<LorryPaymentViewModel> LorryPayments { get; } = new();
    public List<InvoiceViewModel> Invoices { get; } = new();
    public List<MoneyReceiptViewModel> MoneyReceipts { get; } = new();
    public List<BranchViewModel> Branches { get; } = new();
    public List<LocationViewModel> Locations { get; } = new();
    public List<CustomerViewModel> Customers { get; } = new();
    public List<DriverViewModel> Drivers { get; } = new();
    public List<VehicleViewModel> Vehicles { get; } = new();
    public List<PermissionViewModel> Permissions { get; } = new();
    public List<RoleViewModel> Roles { get; } = new();
    public List<UserViewModel> Users { get; } = new();
    public Dictionary<Guid, string> UserPasswords { get; } = new();
    public Dictionary<string, Guid> Tokens { get; } = new();

    private void SeedPermissions()
    {
        if (Permissions.Count > 0) return;

        var keys = new[]
        {
            ("consignment", "view"), ("consignment", "create"), ("consignment", "edit"),
            ("challan", "view"), ("challan", "create"), ("challan", "payment"),
            ("invoice", "view"), ("invoice", "create"), ("invoice", "post"),
            ("receipt", "view"), ("receipt", "create"),
            ("report", "booking"), ("report", "lorry_payment"), ("report", "vehicle_payment"), ("report", "outstanding"),
            ("traffic", "plan"),
            ("settings", "branch"), ("settings", "location"), ("settings", "customer"), ("settings", "driver"), ("settings", "vehicle"),
            ("users", "manage"), ("roles", "manage")
        };

        foreach (var (moduleCode, actionCode) in keys)
        {
            Permissions.Add(new PermissionViewModel
            {
                Id = Guid.NewGuid(),
                ModuleCode = moduleCode,
                ActionCode = actionCode
            });
        }
    }
}


