package codythai92.bcs430loginpage;

import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.stage.Stage;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.control.Label;

import java.io.File;
import java.util.ResourceBundle;
import java.net.URL;


public class loginController implements Initializable {
    @FXML
    private Button cancelButton;

    @FXML
    private Label loginMessageLabel;

    @FXML
    private ImageView brandingImageView;

    @FXML
    private ImageView  loginImageView;

    @FXML
    private TextField usernameTextField;
    @FXML
    private TextField enterPasswordField;




    @Override
    public void initialize (URL url, ResourceBundle resourceBundle){
        File brandingFile = new File("images/logo.png");
        Image brandingImage = new Image(brandingFile.toURI().toString());
        brandingImageView.setImage(brandingImage);


        File loginFile = new File("images/loginicon.png");
        Image loginImage = new Image(loginFile.toURI().toString());
        loginImageView.setImage(loginImage);

    }

    public void loginButtonOnAction(ActionEvent actionEvent) {

        if(usernameTextField.getText().isBlank() == false|| enterPasswordField.getText().isBlank()==false){
            validateLogin();

        } else {
            loginMessageLabel.setText("Enter your username and password");
        }
    }


    public void cancelButtonAction(ActionEvent actionEvent) {
        Stage stage = (Stage) cancelButton.getScene().getWindow();
        stage.close();
    }

    public void validateLogin(String username, String password){
        if(username.isEmpty() || password.isEmpty()){}
    }




}
