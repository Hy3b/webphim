package team.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
public class hello {
    @GetMapping
    public String xinchao() {
        return "Chao mung ban den voi api cua web phim";
    }
}
