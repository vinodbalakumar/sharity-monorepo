package com.java.vinod.authorization.server.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {
    private final String frontendHomeUrl;
    private final String frontendRegisterUrl;
    private final String frontendForgotPasswordUrl;

    public PageController(@Value("${app.social.frontend-login-success-url:https://vinodbalakumar.com/app/}") String frontendHomeUrl,
                          @Value("${app.social.frontend-register-url:https://vinodbalakumar.com/app/register}") String frontendRegisterUrl,
                          @Value("${app.social.frontend-forgot-password-url:https://vinodbalakumar.com/app/forgot-password}") String frontendForgotPasswordUrl) {
        this.frontendHomeUrl = frontendHomeUrl;
        this.frontendRegisterUrl = frontendRegisterUrl;
        this.frontendForgotPasswordUrl = frontendForgotPasswordUrl;
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
                            background: #f4f7fb;
                            color: #12263a;
                        }

                        * {
                            box-sizing: border-box;
                        }

                        body {
                            margin: 0;
                            min-height: 100vh;
                            overflow-x: hidden;
                            background:
                                radial-gradient(circle at 18% 12%, rgba(242, 154, 74, 0.12), transparent 24rem),
                                radial-gradient(circle at 82% 8%, rgba(63, 136, 197, 0.12), transparent 24rem),
                                linear-gradient(180deg, #f7fbff 0%, #f4f7fb 54%, #eef6fd 100%);
                        }

                        .topbar {
                            min-height: 74px;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 24px;
                            padding: 0 32px;
                            border-bottom: 1px solid #dbe4ef;
                            background: rgba(247, 251, 255, 0.94);
                        }

                        .brand {
                            display: inline-flex;
                            align-items: center;
                            gap: 12px;
                            color: #12263a;
                            font-weight: 700;
                            font-size: 21px;
                            text-decoration: none;
                        }

                        .brand-mark {
                            width: 40px;
                            height: 40px;
                            display: grid;
                            place-items: center;
                            border-radius: 10px;
                            background: #2459d3;
                            color: #ffffff;
                            font-weight: 700;
                        }

                        .top-link {
                            color: #12263a;
                            font-size: 14px;
                            font-weight: 600;
                            text-decoration: none;
                        }

                        .shell {
                            min-height: calc(100vh - 74px);
                            display: grid;
                            place-items: center;
                            padding: 48px 16px;
                        }

                        main {
                            width: 100%;
                            max-width: 520px;
                            background: #ffffff;
                            border: 1px solid rgba(219, 228, 239, 0.78);
                            border-radius: 16px;
                            padding: 34px;
                            box-shadow: 0 24px 64px rgba(18, 38, 58, 0.10);
                            color: #12263a;
                        }

                        h1 {
                            margin: 0 0 10px;
                            font-size: 38px;
                            line-height: 1.08;
                            letter-spacing: 0;
                        }

                        p {
                            margin: 0 0 26px;
                            color: #64778c;
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
                            border: 1px solid #dbe4ef;
                            border-radius: 10px;
                            background: #ffffff;
                            color: #12263a;
                            font-size: 16px;
                            font-weight: 700;
                            text-decoration: none;
                            box-shadow: 0 10px 24px rgba(18, 38, 58, 0.08);
                        }

                        .social:hover {
                            background: #f8fbff;
                            box-shadow: 0 12px 28px rgba(18, 38, 58, 0.12);
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
                            font-weight: 700;
                        }

                        .social-note {
                            margin: 0 0 24px;
                            color: #64778c;
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
                            border: 1px solid #dbe4ef;
                            border-radius: 16px;
                            margin-bottom: 20px;
                            background: #ffffff;
                            color: #12263a;
                            font-size: 16px;
                            outline: none;
                        }

                        input, button { font-family: inherit; }
                        a:focus-visible, button:focus-visible { outline: 3px solid #8ab1ff; outline-offset: 3px; }

                        input:focus {
                            border-color: #2459d3;
                            box-shadow: 0 0 0 4px rgba(36, 89, 211, 0.14);
                        }

                        button {
                            width: 100%;
                            min-height: 56px;
                            padding: 15px 18px;
                            border: 0;
                            border-radius: 10px;
                            background: #2459d3;
                            color: #ffffff;
                            font-size: 17px;
                            font-weight: 700;
                            cursor: pointer;
                        }

                        button:hover {
                            background: #1945ad;
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
                            color: #64778c;
                        }

                        .register {
                            margin-top: 24px;
                            text-align: center;
                            color: #64778c;
                            font-size: 15px;
                        }

                        .links {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 12px;
                            margin: 10px 0 0;
                            font-size: 14px;
                            flex-wrap: wrap;
                        }

                        .links a {
                            color: #2459d3;
                            font-weight: 600;
                            text-decoration: none;
                        }

                        .links a:hover {
                            text-decoration: underline;
                        }

                        .register a {
                            color: #12263a;
                            font-weight: 700;
                            text-decoration: none;
                        }

                        @media (max-width: 768px) {
                            .topbar {
                                gap: 12px;
                                padding: 0 12px;
                            }

                            .shell {
                                padding: 20px 12px 28px;
                            }

                            .shell {
                                padding: 20px 12px 28px;
                            }

                            main {
                                padding: 24px;
                                border-radius: 24px;
                            }

                            h1 {
                                font-size: 32px;
                            }

                            p {
                                font-size: 15px;
                            }

                            input {
                                padding: 16px 14px;
                            }
                        }

                        @media (max-width: 420px) {
                            .topbar {
                                gap: 12px;
                                padding: 0 12px;
                            }

                            .brand {
                                font-size: 18px;
                                gap: 10px;
                                min-width: 0;
                            }

                            .top-link {
                                font-size: 13px;
                                text-align: right;
                            }

                            main {
                                padding: 20px;
                                border-radius: 20px;
                            }

                            h1 {
                                font-size: 28px;
                            }

                            .social,
                            button {
                                min-height: 52px;
                            }
                        }
                    </style>
                </head>
                <body>
                <header class="topbar">
                    <a class="brand" href="__FRONTEND_HOME_URL__">
                        <span class="brand-mark">S</span>
                        <span>Sharity</span>
                    </a>
                    <a class="top-link" href="__FRONTEND_REGISTER_URL__">Create account</a>
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
                        <div class="links">
                            <a href="__FORGOT_PASSWORD_URL__">Forgot password?</a>
                            <a href="__FRONTEND_REGISTER_URL__">Create an account</a>
                        </div>
                    </main>
                </div>
                </body>
                </html>
                """
                .replace("__ERROR_BANNER__", errorBanner)
                .replace("__SOCIAL_ERROR_BANNER__", socialErrorBanner)
                .replace("__CONTINUE_INPUT__", continueInput)
                .replace("__CSRF_INPUT__", csrfInput)
                .replace("__LOGIN_ACTION__", loginAction)
                .replace("__FRONTEND_HOME_URL__", htmlAttribute(frontendHomeUrl))
                .replace("__FRONTEND_REGISTER_URL__", htmlAttribute(frontendRegisterUrl))
                .replace("__FORGOT_PASSWORD_URL__", htmlAttribute(frontendForgotPasswordUrl));
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
