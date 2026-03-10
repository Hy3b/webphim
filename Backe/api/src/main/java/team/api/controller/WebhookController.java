package team.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import team.api.dto.request.SePayWebhookRequest;
import team.api.service.WebhookService;
import java.util.Map;

@RestController
@RequestMapping("/api/webhook")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookService webhookService;

    @PostMapping("/sepay-webhook_FAKE_TEST")
    public ResponseEntity<Map<String, Boolean>> receivePaymentWebhook(@RequestBody SePayWebhookRequest request) {
        try {
            webhookService.processPaymentWebhook(request);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false));
        }
    }
}
