/*import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;

// Firestore
import com.google.cloud.firestore.Firestore;

import java.io.InputStream;

public class FirebaseService {

    private static Firestore db;

    public static void initialize() {

        if (db != null) {
            return;
        }

        try {

            InputStream serviceAccount =
                    FirebaseService.class.getClassLoader().getResourceAsStream("key.json");

            if (serviceAccount == null) {
                throw new RuntimeException("key.json not found in src/main/resources");
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }

            db = FirestoreClient.getFirestore();

            System.out.println("Firebase initialized.");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static Firestore getDb() {
        return db;
    }
    **/
