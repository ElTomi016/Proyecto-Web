package com.example.demo.system;

import com.microsoft.playwright.*;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.assertions.LocatorAssertions;
import com.microsoft.playwright.assertions.PlaywrightAssertions;
import com.microsoft.playwright.options.SelectOption;
import com.microsoft.playwright.options.WaitForSelectorState;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("systemtest")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SystemUITest {

    private static final Path FRONTEND_DIR = Path.of("..", "frontend").toAbsolutePath().normalize();

    private final String frontendHost = "127.0.0.1";
    private int frontendPort = -1;
    private String frontendBaseUrl;
    private Process frontendProcess;
    private Thread frontendOutputThread;
    private Playwright playwright;
    private Browser browser;

    @BeforeAll
    void startEnvironment() throws Exception {
        waitForBackendReady();
        startFrontendServer();
        playwright = Playwright.create();
        browser = playwright.firefox().launch(new BrowserType.LaunchOptions().setHeadless(true));
    }

    @AfterAll
    void tearDown() throws Exception {
        if (browser != null) {
            browser.close();
        }
        if (playwright != null) {
            playwright.close();
        }
        if (frontendProcess != null && frontendProcess.isAlive()) {
            frontendProcess.destroy();
            frontendProcess.waitFor(10, TimeUnit.SECONDS);
        }
        if (frontendOutputThread != null && frontendOutputThread.isAlive()) {
            frontendOutputThread.interrupt();
        }
    }

    @Test
    void userCanConfigureAndPlayMatch() {
        try (BrowserContext context = browser.newContext(new Browser.NewContextOptions().setBaseURL(frontendBaseUrl))) {
            Page page = context.newPage();
            page.onConsoleMessage(msg -> System.out.println("[browser-console] " + msg.text()));
            page.onRequest(req -> {
                if (req.url().contains("/api/")) {
                    System.out.println("[browser-request] " + req.method() + " " + req.url());
                }
            });
            page.onRequestFailed(req -> {
                if (req.url().contains("/api/")) {
                    System.out.println("[browser-request-failed] " + req.url() + " :: " + req.failure());
                }
            });
            page.onResponse(resp -> {
                if (resp.url().contains("/api/")) {
                    System.out.println("[browser-response] " + resp.status() + " " + resp.url());
                }
            });
            String suffix = Long.toString(System.currentTimeMillis());
            String jugadorName = "Capitana " + suffix;
            String jugadorEmail = String.format(Locale.ROOT, "capitana%s@test.dev", suffix);
            String jugadorPhone = "555-" + suffix.substring(Math.max(suffix.length() - 4, 0));
            String modeloNombre = "Modelo Sistema " + suffix;
            String modeloColor = "Coral";

            login(page, "admin", "admin123");
            long jugadorId = createJugador(page, jugadorName, jugadorEmail, jugadorPhone);
            long modeloId = createModelo(page, modeloNombre, modeloColor);
            long barcoId = createBarco(page, jugadorId, modeloId, jugadorName, modeloNombre);
            long partidaId = createMatch(page, barcoId, jugadorName);

            page.click("#topbar-logout");
            page.waitForURL("**/login");

            String jugadorUsername = "jugador" + jugadorId;
            login(page, jugadorUsername, jugadorUsername + "123");
            page.waitForURL("**/juego", new Page.WaitForURLOptions().setTimeout(60_000));

            loadPartidaAsJugador(page, partidaId);
            playTurnAsJugador(page, jugadorName, barcoId);

            // Stay on map so assertions above guarantee complete flow.
        }
    }

    private void login(Page page, String username, String password) {
        page.navigate("/login");
        page.waitForSelector("#login-form", new Page.WaitForSelectorOptions().setState(WaitForSelectorState.VISIBLE));
        page.fill("#login-username", username);
        page.fill("#login-password", password);
        page.click("#login-submit");
        try {
            page.waitForSelector("#topbar-user-info", new Page.WaitForSelectorOptions().setTimeout(60_000));
        } catch (PlaywrightException ex) {
            String errorText = safeText(page, "#login-error");
            if (!errorText.isBlank()) {
                System.out.println("[browser-login-error] " + errorText.trim());
            }
            captureScreenshot(page, "login-failure");
            throw ex;
        }
    }

    private String safeText(Page page, String selector) {
        try {
            Locator locator = page.locator(selector);
            if (locator.isVisible()) {
                String txt = locator.innerText();
                return txt == null ? "" : txt;
            }
        } catch (Exception ignored) {}
        return "";
    }

    private void captureScreenshot(Page page, String name) {
        try {
            Path out = Path.of("target", name + "-" + System.currentTimeMillis() + ".png");
            java.nio.file.Files.createDirectories(out.getParent());
            page.screenshot(new Page.ScreenshotOptions().setPath(out).setFullPage(true));
            System.out.println("[browser-screenshot] Saved " + out.toAbsolutePath());
        } catch (Exception ignored) {}
    }

    private long createJugador(Page page, String nombre, String email, String telefono) {
        page.click("#nav-admin-jugadores");
        page.waitForURL("**/admin/jugadores");
        page.waitForSelector("#jugadores-page");
        page.click("#jugadores-new-button");
        page.waitForURL("**/admin/jugadores/nuevo");
        page.waitForSelector("#jugador-form");
        page.fill("#jugador-nombre", nombre);
        page.fill("#jugador-email", email);
        page.fill("#jugador-telefono", telefono);
        page.click("#jugador-save-button");
        page.waitForURL("**/admin/jugadores");
        page.waitForSelector("#jugadores-table");
        Locator jugadorRow = page.locator("#jugadores-table tbody tr")
                .filter(new Locator.FilterOptions().setHasText(nombre));
        assertThat(jugadorRow).hasCount(1);
        String idText = jugadorRow.locator("td").first().innerText().trim();
        Assertions.assertFalse(idText.isBlank(), "Jugador ID no detectado");
        return Long.parseLong(idText);
    }

    private long createModelo(Page page, String nombre, String color) {
        page.click("#nav-admin-modelos");
        page.waitForURL("**/admin/modelos");
        page.waitForSelector("#modelos-page");
        page.click("#modelos-new-button");
        page.waitForURL("**/admin/modelos/nuevo");
        page.waitForSelector("#modelo-form");
        page.fill("#modelo-nombre", nombre);
        page.fill("#modelo-color", color);
        page.click("#modelo-save-button");
        page.waitForURL("**/admin/modelos");
        page.waitForSelector("#modelos-table");
        Locator modeloRow = page.locator("#modelos-table tbody tr")
                .filter(new Locator.FilterOptions().setHasText(nombre));
        assertThat(modeloRow).hasCount(1);
        String idText = modeloRow.locator("td").first().innerText().trim();
        Assertions.assertFalse(idText.isBlank(), "Modelo ID no detectado");
        return Long.parseLong(idText);
    }

    private long createBarco(Page page, long jugadorId, long modeloId, String jugadorName, String modeloNombre) {
        page.click("#nav-admin-barcos");
        page.waitForURL("**/admin/barcos");
        page.waitForSelector("#barcos-page");
        page.click("#barcos-new-button");
        page.waitForURL("**/admin/barcos/nuevo");
        page.waitForSelector("#barco-form");
        page.fill("#barco-posx", "2");
        page.fill("#barco-posy", "2");
        page.fill("#barco-velx", "0");
        page.fill("#barco-vely", "0");
        Page.WaitForSelectorOptions dropdownWait = new Page.WaitForSelectorOptions()
                .setState(WaitForSelectorState.ATTACHED)
                .setTimeout(30_000);
        page.waitForSelector("#barco-jugador option:not([disabled])", dropdownWait);
        page.waitForSelector("#barco-modelo option:not([disabled])", dropdownWait);
        page.selectOption("#barco-jugador", new SelectOption().setLabel(jugadorName));
        page.selectOption("#barco-modelo", new SelectOption().setLabel(modeloNombre));
        page.click("#barco-save-button");
        page.waitForURL("**/admin/barcos");
        page.waitForSelector("#barcos-table");
        Locator barcoRow = page.locator("#barcos-table tbody tr")
                .filter(new Locator.FilterOptions().setHasText(jugadorName));
        assertThat(barcoRow).hasCount(1);
        String idText = barcoRow.locator("td").first().innerText().trim();
        Assertions.assertFalse(idText.isBlank(), "Barco ID no detectado");
        return Long.parseLong(idText);
    }

    private long createMatch(Page page, long barcoId, String jugadorName) {
        page.click("#nav-game");
        page.waitForURL("**/juego");
        page.waitForSelector("#game-launcher");
        page.click("#launcher-create-button");
        page.waitForSelector("#create-panel");
        Locator firstMap = page.locator("input[id^='map-option-']").first();
        firstMap.check();
        page.check("#boat-checkbox-" + barcoId);
        page.click("#create-partida-button");
        page.waitForURL("**/juego");
        waitForMapReady(page);
        Locator chip = page.locator("#current-partida-chip");
        assertThat(chip).isVisible();
        Locator playerLabel = page.locator("#player-name-label");
        PlaywrightAssertions.assertThat(playerLabel).containsText(jugadorName,
                new LocatorAssertions.ContainsTextOptions().setTimeout(30_000));
        String chipText = chip.innerText().trim();
        long partidaId = Long.parseLong(chipText.replaceAll("\\D", ""));
        Assertions.assertTrue(partidaId > 0, "Partida ID inválido");
        return partidaId;
    }

    private void loadPartidaAsJugador(Page page, long partidaId) {
        page.waitForSelector("#game-launcher");
        page.click("#launcher-load-button");
        page.waitForSelector("#load-panel");
        Locator card = page.locator("#partida-card-" + partidaId);
        assertThat(card).isVisible();
        card.click();
        page.click("#load-start-button");
        page.waitForURL("**/juego");
        waitForMapReady(page);
        assertThat(page.locator("#current-partida-chip")).containsText("#" + partidaId);
    }

    private void playTurnAsJugador(Page page, String jugadorName, long barcoId) {
        assertThat(page.locator("#player-name-label")).containsText(jugadorName);
        assertThat(page.locator("#turn-indicator")).containsText("#" + barcoId);
        String initialVelocity = page.locator("#current-velocity").innerText().trim();
        String initialPosition = page.locator("#position-values").innerText().trim();
        page.click("#move-right");
        page.waitForFunction("selector => document.querySelector(selector)?.textContent?.includes('vx=1 vy=0')",
                "#next-velocity", new Page.WaitForFunctionOptions().setTimeout(10_000));
        page.click("#confirm-move-button");
        page.reload();
        page.waitForURL("**/juego");
        waitForMapReady(page);
        PlaywrightAssertions.assertThat(page.locator("#current-velocity")).containsText("vx=1 vy=0",
                new LocatorAssertions.ContainsTextOptions().setTimeout(30_000));
        page.waitForFunction(
                "data => { const node = document.querySelector(data.selector); return !!node && node.textContent !== data.expected; }",
                Map.of("selector", "#position-values", "expected", initialPosition),
                new Page.WaitForFunctionOptions().setTimeout(30_000));
        String updatedPosition = page.locator("#position-values").innerText().trim();
        Assertions.assertNotEquals(initialPosition, updatedPosition, "La posición no cambió tras mover el barco");
        Assertions.assertNotEquals(initialVelocity, page.locator("#current-velocity").innerText().trim(),
                "La velocidad no cambió tras confirmar el movimiento");
    }

    private void waitForMapReady(Page page) {
        page.waitForFunction("() => { const shell = document.querySelector('#map-shell'); return !!shell && !shell.classList.contains('hidden'); }",
                null, new Page.WaitForFunctionOptions().setTimeout(60_000));
        page.waitForFunction("() => !document.querySelector('#map-loader')", null,
                new Page.WaitForFunctionOptions().setTimeout(60_000));
        assertThat(page.locator("#map-canvas-root canvas")).isVisible();
    }

    private void startFrontendServer() throws Exception {
        if (frontendProcess != null && frontendProcess.isAlive()) {
            return;
        }
        frontendPort = findFreePort();
        frontendBaseUrl = "http://" + frontendHost + ":" + frontendPort;
        ProcessBuilder pb = new ProcessBuilder(
                "npm", "run", "start", "--", "--port", Integer.toString(frontendPort), "--host", frontendHost);
        pb.directory(FRONTEND_DIR.toFile());
        pb.redirectErrorStream(true);
        Map<String, String> env = pb.environment();
        env.putIfAbsent("CI", "true");
        env.put("BROWSER", "none");
        env.put("NG_CLI_ANALYTICS", "false");
        env.putIfAbsent("API_BASE_URL", "http://127.0.0.1:8080");
        env.put("PORT", Integer.toString(frontendPort));
        env.put("HOST", frontendHost);
        frontendProcess = pb.start();
        frontendOutputThread = new Thread(() -> {
            try (var reader = new java.io.BufferedReader(new java.io.InputStreamReader(frontendProcess.getInputStream()))) {
                String line;
                while (!Thread.currentThread().isInterrupted() && (line = reader.readLine()) != null) {
                    System.out.println("[frontend] " + line);
                }
            } catch (Exception ignored) {
            }
        });
        frontendOutputThread.setDaemon(true);
        frontendOutputThread.start();
        waitForHttp(frontendBaseUrl + "/");
    }

    private int findFreePort() throws IOException {
        try (java.net.ServerSocket socket = new java.net.ServerSocket(0)) {
            socket.setReuseAddress(true);
            return socket.getLocalPort();
        }
    }

    private void waitForBackendReady() throws Exception {
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        long deadline = System.currentTimeMillis() + Duration.ofSeconds(60).toMillis();
        while (System.currentTimeMillis() < deadline) {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://127.0.0.1:8080/api/auth/login"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                    .build();
            try {
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    return;
                }
            } catch (IOException | InterruptedException ignored) {
                Thread.sleep(1000);
            }
            Thread.sleep(1000);
        }
        throw new IllegalStateException("Backend no respondió a tiempo");
    }

    private void waitForHttp(String url) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NEVER)
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .GET()
                .build();
        long deadline = System.nanoTime() + Duration.ofMinutes(3).toNanos();
        Exception lastError = null;
        int attempt = 0;
        while (System.nanoTime() < deadline) {
            attempt++;
            if (frontendProcess != null && !frontendProcess.isAlive()) {
                throw new IllegalStateException("Frontend finalizó inesperadamente con código " + frontendProcess.exitValue());
            }
            try {
                if (!isPortOpen(frontendHost, frontendPort)) {
                    Thread.sleep(500);
                    continue;
                }
                HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());
                if (response.statusCode() < 500) {
                    return;
                }
                lastError = null;
            } catch (IOException | InterruptedException ex) {
                lastError = ex;
            }
            Thread.sleep(1000);
        }
        String message = "Frontend no respondió a tiempo";
        if (lastError != null) {
            message += ": " + lastError.getMessage();
        }
        throw new IllegalStateException(message);
    }

    private boolean isPortOpen(String host, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 2000);
            return socket.isConnected();
        } catch (IOException ex) {
            return false;
        }
    }
}
