package com.textflow.smssender.modules;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.widget.Toast;
import com.textflow.smssender.MyFirebaseMessagingService;
import com.textflow.smssender.MainActivity;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import java.util.List;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import androidx.core.app.ActivityCompat;
import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;

public class YourModuleName extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;

    public YourModuleName(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "YourModuleName";
    }

    @ReactMethod
    public void showToast(String message) {
        Toast.makeText(reactContext, message, Toast.LENGTH_SHORT).show();
    }

    @ReactMethod
    public void getFirebaseToken(Promise promise) {
        String token = MyFirebaseMessagingService.getToken(reactContext);
        if (token != null && !token.isEmpty()) {
            promise.resolve(token);
        } else {
            promise.resolve("EMPTY");
        }
    }

    @ReactMethod
    public void getSubscriptionInfo(Promise promise) {

        if (ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED){
            promise.resolve("Errorr");
            return;
        }
        SubscriptionManager subscriptionManager = (SubscriptionManager) reactContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
        List<SubscriptionInfo> subscriptionInfoList = subscriptionManager.getActiveSubscriptionInfoList();
        WritableArray subscriptionArray = Arguments.createArray();
        try {
            for (SubscriptionInfo subscriptionInfo : subscriptionInfoList) {
                WritableMap subscriptionMap = Arguments.createMap();
                subscriptionMap.putInt("slot_id", subscriptionInfo.getSimSlotIndex());
                subscriptionMap.putString("sim_name", subscriptionInfo.getDisplayName().toString());
                subscriptionMap.putString("carrier_name", subscriptionInfo.getCarrierName().toString());
                subscriptionMap.putString("country", subscriptionInfo.getCountryIso());
                subscriptionArray.pushMap(subscriptionMap);
            }
            promise.resolve(subscriptionArray);
        } catch (Exception e) {
            promise.resolve(e.getMessage());
        }
    }
}