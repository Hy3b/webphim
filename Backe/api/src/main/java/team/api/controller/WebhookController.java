package team.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import team.api.dto.request.WebhookRequest;
import team.api.service.WebhookService;

@RestController
@RequestMapping("/api/webhook")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookService webhookService;

    @PostMapping("/payment")
    public ResponseEntity<String> receivePaymentWebhook(@RequestBody WebhookRequest request) {
        try {
            String result = webhookService.processPaymentWebhook(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Webhook processing failed: " + e.getMessage());
        }
    }
}
