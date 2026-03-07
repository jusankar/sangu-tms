using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Application.Interfaces;

public interface IChallanService
{
    Task<IReadOnlyCollection<ChallanViewModel>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ChallanViewModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ChallanViewModel> CreateAsync(ChallanCreateModel model, CancellationToken cancellationToken = default);
    Task<LorryPaymentViewModel?> AddPaymentAsync(Guid challanId, LorryPaymentCreateModel model, CancellationToken cancellationToken = default);
}

