package com.projectname;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class ImageClipboardModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public ImageClipboardModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "ImageClipboard";
    }

    @ReactMethod
    public void copyBase64ImageToClipboard(String base64String, Promise promise) {
        try {
            // Decode Base64 to Bitmap
            byte[] decodedBytes = Base64.decode(base64String, Base64.DEFAULT);
            Bitmap bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);

            if (bitmap == null) {
                promise.reject("INVALID_IMAGE", "Failed to decode Base64 image");
                return;
            }

            // Save the image as a temporary file
            File cacheDir = reactContext.getCacheDir();
            File imageFile = new File(cacheDir, "clipboard_image.png");

            OutputStream os = new FileOutputStream(imageFile);
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, os);
            os.flush();
            os.close();

            // Get URI for File
            Uri imageUri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                imageUri = FileProvider.getUriForFile(
                        reactContext,
                        reactContext.getPackageName() + ".provider",
                        imageFile
                );
            } else {
                imageUri = Uri.fromFile(imageFile);
            }

            // Copy Image to Clipboard
            ClipboardManager clipboard = (ClipboardManager) reactContext.getSystemService(Context.CLIPBOARD_SERVICE);
            ClipData clip = ClipData.newUri(reactContext.getContentResolver(), "Image", imageUri);
            clipboard.setPrimaryClip(clip);

            promise.resolve("Base64 image copied to clipboard successfully");
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
