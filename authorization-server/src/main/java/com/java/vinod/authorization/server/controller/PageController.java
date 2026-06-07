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
                                        @RequestParam(value = "socialError", required = false) String socialError,
                                        @RequestParam(value = "continue", required = false) String continueUrl) {
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(buildLoginPage(request, error != null, socialError, continueUrl));
    }

    private String buildLoginPage(HttpServletRequest request, boolean error, String socialError, String continueUrl) {
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
        String socialErrorBanner = (socialError == null || socialError.isBlank()) ? "" : """
                <div class="alert" role="alert">
                    __SOCIAL_ERROR__
                </div>
                """
                .replace("__SOCIAL_ERROR__", htmlText(socialError));
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
                    <title>Sharity Sign In</title>
                    <style>
                        :root {
                            color-scheme: light;
                            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                            background: #0b1028;
                            color: #f8fafc;
                        }

                        * {
                            box-sizing: border-box;
                        }

                        body {
                            margin: 0;
                            min-height: 100vh;
                            background:
                                radial-gradient(circle at 18% 18%, rgba(124, 92, 255, 0.26), transparent 28rem),
                                linear-gradient(180deg, #0d132b 0%, #0b1028 52%, #11183a 100%);
                        }

                        .topbar {
                            min-height: 74px;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 24px;
                            padding: 0 32px;
                            border-bottom: 1px solid #20284a;
                            background: #0d132b;
                        }

                        .brand {
                            display: inline-flex;
                            align-items: center;
                            gap: 12px;
                            color: #f8fafc;
                            font-weight: 900;
                            font-size: 21px;
                            text-decoration: none;
                        }

                        .brand-mark {
                            width: 40px;
                            height: 40px;
                            display: grid;
                            place-items: center;
                            border-radius: 10px;
                            background: #7c5cff;
                            color: #ffffff;
                            font-weight: 900;
                        }

                        .top-link {
                            color: #f8fafc;
                            font-size: 14px;
                            font-weight: 800;
                            text-decoration: none;
                        }

                        .shell {
                            min-height: calc(100vh - 74px);
                            display: grid;
                            place-items: center;
                            padding: 48px 20px;
                        }

                        main {
                            width: min(92vw, 520px);
                            background: rgba(255, 255, 255, 0.98);
                            border: 1px solid rgba(226, 232, 240, 0.72);
                            border-radius: 20px;
                            padding: 34px;
                            box-shadow: 0 28px 80px rgba(2, 6, 23, 0.28);
                            color: #050713;
                        }

                        h1 {
                            margin: 0 0 10px;
                            font-size: 38px;
                            line-height: 1.08;
                            letter-spacing: 0;
                        }

                        p {
                            margin: 0 0 26px;
                            color: #667085;
                            font-size: 17px;
                            line-height: 1.5;
                        }

                        .social {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 12px;
                            width: 100%;
                            min-height: 56px;
                            margin: 4px 0 18px;
                            border: 1px solid #d0d5dd;
                            border-radius: 999px;
                            background: #ffffff;
                            color: #050713;
                            font-size: 16px;
                            font-weight: 900;
                            text-decoration: none;
                            box-shadow: 0 10px 24px rgba(2, 6, 23, 0.08);
                        }

                        .social:hover {
                            background: #f8fafc;
                            box-shadow: 0 12px 28px rgba(2, 6, 23, 0.12);
                            transform: translateY(-1px);
                        }

                        .social-icon {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            width: 22px;
                            height: 22px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #4285F4 0 25%, #34A853 25% 50%, #FBBC05 50% 75%, #EA4335 75% 100%);
                            color: #fff;
                            font-size: 12px;
                            line-height: 1;
                            font-weight: 900;
                        }

                        .social-note {
                            margin: 0 0 24px;
                            color: #667085;
                            font-size: 14px;
                            line-height: 1.5;
                        }

                        label {
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 850;
                            font-size: 15px;
                        }

                        input {
                            width: 100%;
                            padding: 18px 16px;
                            border: 1px solid transparent;
                            border-radius: 16px;
                            margin-bottom: 20px;
                            background: #f0f0f3;
                            color: #050713;
                            font-size: 16px;
                            outline: none;
                        }

                        input:focus {
                            border-color: #7c5cff;
                            box-shadow: 0 0 0 4px rgba(124, 92, 255, 0.14);
                        }

                        button {
                            width: 100%;
                            min-height: 56px;
                            padding: 15px 18px;
                            border: 0;
                            border-radius: 999px;
                            background: #050713;
                            color: #ffffff;
                            font-size: 17px;
                            font-weight: 900;
                            cursor: pointer;
                        }

                        button:hover {
                            background: #11183a;
                        }

                        .alert {
                            margin: 0 0 18px;
                            padding: 12px 14px;
                            border-radius: 14px;
                            background: #fff1f2;
                            color: #be123c;
                            border: 1px solid #fecdd3;
                        }

                        .hint {
                            margin-top: 18px;
                            font-size: 14px;
                            line-height: 1.5;
                            color: #667085;
                        }

                        .register {
                            margin-top: 24px;
                            text-align: center;
                            color: #667085;
                            font-size: 15px;
                        }

                        .register a {
                            color: #050713;
                            font-weight: 900;
                            text-decoration: none;
                        }

                        @media (max-width: 640px) {
                            .topbar {
                                padding: 0 18px;
                            }

                            main {
                                padding: 26px;
                                border-radius: 18px;
                            }

                            h1 {
                                font-size: 32px;
                            }
                        }
                    </style>
                </head>
                <body>
                <header class="topbar">
                    <a class="brand" href="/app/">
                        <span class="brand-mark">S</span>
                        <span>Sharity</span>
                    </a>
                    <a class="top-link" href="/app/register">Create account</a>
                </header>
                <div class="shell">
                    <main>
                        <h1>Sign in</h1>
                        <p>Use your Sharity account email and password to continue.</p>
                        <a class="social" href="/authorization-server/api/v1/auth/social/google/start?flow=login">
                            <span class="social-icon" aria-hidden="true">G</span>
                            <span>Sign in with Google</span>
                        </a>
                        <div class="social-note">Use the Google account linked to your Sharity profile.</div>
                        __ERROR_BANNER__
                        __SOCIAL_ERROR_BANNER__
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
                        <div class="register">New to Sharity? <a href="/app/register">Create an account</a></div>
                    </main>
                </div>
                </body>
                </html>
                """
                        .replace("__ERROR_BANNER__", errorBanner)
                .replace("__SOCIAL_ERROR_BANNER__", socialErrorBanner)
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

    private String htmlText(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
