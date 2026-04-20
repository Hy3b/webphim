using System.Text.Json.Serialization;

namespace WebPhimApi.DTOs;

/// <summary>Payload JSON từ SePay webhook. Docs: https://sepay.vn/docs/webhook</summary>
public record SePayWebhookRequest(
    [property: JsonPropertyName("id")]              long Id,
    [property: JsonPropertyName("gateway")]         string Gateway,
    [property: JsonPropertyName("transactionDate")] string TransactionDate,
    [property: JsonPropertyName("accountNumber")]   string AccountNumber,
    [property: JsonPropertyName("transferAmount")]  decimal TransferAmount,
    [property: JsonPropertyName("content")]         string Content,
    [property: JsonPropertyName("referenceCode")]   string ReferenceCode
);
