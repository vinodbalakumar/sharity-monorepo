package com.java.vinod.authorization.server.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {
    public PageController() {
    }

    @GetMapping("/")
    public String home() {
        return "forward:/verify-email.html";
    }

    @GetMapping("/verify-email")
    public String verifyEmail() {
        return "forward:/verify-email.html";
    }

    @GetMapping("/reset-password")
    public String resetPassword() {
        return "forward:/reset-password.html";
    }

    @GetMapping("/login")
    @ResponseBody
    public ResponseEntity<String> login(HttpServletRequest request,
                                        @RequestParam(value = "error", required = false) String error,
                                        @RequestParam(value = "continue", required = false) String continueUrl) {
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(buildLoginPage(request, error != null, continueUrl));
    }

    private String buildLoginPage(HttpServletRequest request, boolean error, String continueUrl) {
        String loginAction = "/authorization-server/api/login";
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken == null) {
            csrfToken = (CsrfToken) request.getAttribute("_csrf");
        }
        String csrfInput = csrfToken == null ? "" : """
                <input type="hidden" name="__CSRF_PARAMETER__" value="__CSRF_TOKEN__">
                """
                .replace("__CSRF_PARAMETER__", csrfToken.getParameterName())
                .replace("__CSRF_TOKEN__", csrfToken.getToken());
        String errorBanner = error
                ? """
                <div class="alert" role="alert">
                    Invalid credentials.
                </div>
                """
                : "";
        String continueInput = (continueUrl == null || continueUrl.isBlank()) ? "" : """
                <input type="hidden" name="continue" value="__CONTINUE_URL__">
                """
                .replace("__CONTINUE_URL__", htmlAttribute(continueUrl));
        return """
                <!doctype html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Authorization Server Sign In</title>
                    <style>
                        :root {
                            color-scheme: light;
                            font-family: Arial, Helvetica, sans-serif;
                            background: #f6f7f9;
                            color: #18202a;
                        }

                        body {
                            margin: 0;
                            min-height: 100vh;
                            display: grid;
                            place-items: center;
                            background: linear-gradient(180deg, #f6f7f9 0%, #eef2f7 100%);
                        }

                        main {
                            width: min(92vw, 440px);
                            background: #ffffff;
                            border: 1px solid #d9dee7;
                            border-radius: 12px;
                            padding: 28px;
                            box-shadow: 0 12px 34px rgba(24, 32, 42, 0.08);
                        }

                        h1 {
                            margin: 0 0 12px;
                            font-size: 24px;
                            line-height: 1.2;
                        }

                        p {
                            margin: 0 0 18px;
                            color: #526070;
                            line-height: 1.5;
                        }

                        label {
                            display: block;
                            margin-bottom: 6px;
                            font-weight: 600;
                        }

                        input {
                            width: 100%;
                            box-sizing: border-box;
                            padding: 12px 14px;
                            border: 1px solid #b8c2cf;
                            border-radius: 8px;
                            margin-bottom: 16px;
                            font-size: 15px;
                        }

                        button {
                            width: 100%;
                            padding: 12px 14px;
                            border: 0;
                            border-radius: 8px;
                            background: #0f4c81;
                            color: #fff;
                            font-size: 16px;
                            font-weight: 700;
                            cursor: pointer;
                        }

                        .alert {
                            margin: 0 0 16px;
                            padding: 12px 14px;
                            border-radius: 8px;
                            background: #fdecec;
                            color: #9e1c1c;
                            border: 1px solid #f7c6c6;
                        }

                        .hint {
                            margin-top: 16px;
                            font-size: 13px;
                            color: #607086;
                        }
                    </style>
                </head>
                <body>
                <main>
                    <h1>Sign in</h1>
                    <p>Use your Sharity account email and password to continue.</p>
                    __ERROR_BANNER__
                    <form method="post" action="__LOGIN_ACTION__">
                        __CONTINUE_INPUT__
                        __CSRF_INPUT__
                        <label for="username">Email</label>
                        <input id="username" name="username" type="email" autocomplete="email" required autofocus>

                        <label for="password">Password</label>
                        <input id="password" name="password" type="password" autocomplete="current-password" required>

                        <button type="submit">Sign in</button>
                    </form>
                    <div class="hint">If your account is not active or not verified, sign in will be blocked.</div>
                </main>
                </body>
                </html>
                """
                .replace("__ERROR_BANNER__", errorBanner)
                .replace("__CONTINUE_INPUT__", continueInput)
                .replace("__CSRF_INPUT__", csrfInput)
                .replace("__LOGIN_ACTION__", loginAction);
    }

    private String htmlAttribute(String value) {
        return value
                .replace("&", "&amp;")
                .replace("\"", "&quot;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
