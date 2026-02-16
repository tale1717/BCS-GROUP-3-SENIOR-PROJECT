package codythai92.bcs430loginpage;

import codythai92.bcs430loginpage.Firebase.FirebaseService;
import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

public class Main extends Application {

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage stage) throws IOException {

        FirebaseService.initialize();

        FirebaseService.getDb()
                .collection("test")
                .document("ping")
                .set(java.util.Map.of("status", "connected"));

        FXMLLoader fxmlLoader = new FXMLLoader(Main.class.getResource("loginpage.fxml"));
        Scene scene = new Scene(fxmlLoader.load(), 320, 240);

        stage.setTitle("Login");
        stage.setScene(scene);
        stage.show();
    }
}
