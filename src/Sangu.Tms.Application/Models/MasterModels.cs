namespace Sangu.Tms.Application.Models;

public sealed class BranchUpsertModel
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class BranchViewModel
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public bool IsActive { get; set; }
}

public sealed class LocationUpsertModel
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? StateName { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class LocationViewModel
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? StateName { get; set; }
    public bool IsActive { get; set; }
}

public sealed class CustomerUpsertModel
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? GstNo { get; set; }
    public string? Mobile { get; set; }
    public int CreditDays { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class CustomerViewModel
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? GstNo { get; set; }
    public string? Mobile { get; set; }
    public int CreditDays { get; set; }
    public bool IsActive { get; set; }
}

public sealed class DriverUpsertModel
{
    public string Name { get; set; } = string.Empty;
    public string LicenseNo { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? BloodGroup { get; set; }
    public string? Mobile { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class DriverViewModel
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LicenseNo { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? BloodGroup { get; set; }
    public string? Mobile { get; set; }
    public bool IsActive { get; set; }
}

public sealed class VehicleUpsertModel
{
    public string VehicleNumber { get; set; } = string.Empty;
    public string? Make { get; set; }
    public string? Type { get; set; }
    public string? ChassisNumber { get; set; }
    public string? EngineNumber { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class VehicleViewModel
{
    public Guid Id { get; set; }
    public string VehicleNumber { get; set; } = string.Empty;
    public string? Make { get; set; }
    public string? Type { get; set; }
    public string? ChassisNumber { get; set; }
    public string? EngineNumber { get; set; }
    public bool IsActive { get; set; }
}
