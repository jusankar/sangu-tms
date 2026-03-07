using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sangu.Tms.Application.Interfaces;
using Sangu.Tms.Application.Models;

namespace Sangu.Tms.Api.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public sealed class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly IMoneyReceiptService _receiptService;

    public InvoicesController(IInvoiceService invoiceService, IMoneyReceiptService receiptService)
    {
        _invoiceService = invoiceService;
        _receiptService = receiptService;
    }

    [HttpGet]
    [Authorize(Policy = "perm:invoice.view")]
    public async Task<ActionResult<IReadOnlyCollection<InvoiceViewModel>>> GetAll(CancellationToken cancellationToken)
    {
        var rows = await _invoiceService.GetAllAsync(cancellationToken);
        return Ok(rows);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "perm:invoice.view")]
    public async Task<ActionResult<InvoiceViewModel>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var row = await _invoiceService.GetByIdAsync(id, cancellationToken);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    [Authorize(Policy = "perm:invoice.create")]
    public async Task<ActionResult<InvoiceViewModel>> Create([FromBody] InvoiceCreateModel model, CancellationToken cancellationToken)
    {
        try
        {
            var created = await _invoiceService.CreateAsync(model, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/receipts")]
    [Authorize(Policy = "perm:receipt.create")]
    public async Task<ActionResult<MoneyReceiptViewModel>> CreateReceipt(Guid id, [FromBody] MoneyReceiptCreateModel model, CancellationToken cancellationToken)
    {
        try
        {
            var receipt = await _receiptService.CreateForInvoiceAsync(id, model, cancellationToken);
            return receipt is null ? NotFound() : Ok(receipt);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
