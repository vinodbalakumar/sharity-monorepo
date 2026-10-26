import java.net.URI;
import java.net.http.*;
import java.time.Duration;

/** Read-only deployment probe; uses the same JVM trust store and hostname verification as publishers. */
public class TlsProbe {
    public static void main(String[] args) throws Exception {
        var client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        var response=client.send(HttpRequest.newBuilder(URI.create(args[0])).timeout(Duration.ofSeconds(10)).GET().build(),HttpResponse.BodyHandlers.discarding());
        if (response.statusCode()!=200) throw new IllegalStateException("TLS probe status="+response.statusCode());
        System.out.println("TLS trust and hostname validation passed; HTTP 200");
    }
}
