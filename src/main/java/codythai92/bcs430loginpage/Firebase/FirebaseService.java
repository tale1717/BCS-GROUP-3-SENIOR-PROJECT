package codythai92.bcs430loginpage.Firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.firestore.Firestore;

import java.io.InputStream;

public class FirebaseService {

    private static Firestore db;

    private FirebaseService() {
        // Prevent instantiation
    }

    public static synchronized void initialize() {

        if (db != null) {
            return;
        }

        try {

            InputStream serviceAccount =
                    FirebaseService.class
                            .getClassLoader()
                            .getResourceAsStream("key.json");

            if (serviceAccount == null) {
                throw new RuntimeException("key.json not found in resources root.");
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }

            db = FirestoreClient.getFirestore();

            System.out.println("Firebase initialized successfully.");

        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize Firebase", e);
        }
    }

    public static Firestore getDb() {

        if (db == null) {
            throw new IllegalStateException("Firebase not initialized. Call initialize() first.");
        }

        return db;
    }
}
