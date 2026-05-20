package pro.blasto.game;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.OnUserEarnedRewardListener;
import com.google.android.gms.ads.rewarded.RewardItem;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;

@CapacitorPlugin(name = "BlastoAdMob")
public class AdMobPlugin extends Plugin {

    private static final String TAG = "BlastoAdMob";
    private static final String BANNER_ID = "ca-app-pub-2603532225773045/1397910983";
    private static final String REWARD_ID = "ca-app-pub-2603532225773045/8696982352";
    private static final String APP_ID = "ca-app-pub-2603532225773045~2434826332";

    private AdView bannerView;
    private RewardedAd rewardedAd;
    private boolean rewardAdLoading = false;
    private boolean sdkInitialized = false;

    @Override
    public void load() {
        try {
            ensureSdkInitialized();
        } catch (Exception e) {
            Log.e(TAG, "load error", e);
        }
    }

    private void ensureSdkInitialized() {
        if (sdkInitialized) return;

        Context context = getContext();
        if (context == null) {
            Log.w(TAG, "Context not available, skipping AdMob init");
            return;
        }

        try {
            MobileAds.initialize(context, status -> {
                sdkInitialized = true;
                Log.d(TAG, "AdMob SDK initialized");
                preloadRewardAd();
            });
        } catch (Exception e) {
            Log.e(TAG, "AdMob init failed", e);
        }
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            ensureSdkInitialized();
            JSObject result = new JSObject();
            result.put("value", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject(e.getMessage(), e);
        }
    }

    @PluginMethod
    public void showBanner(PluginCall call) {
        String adId = call.getString("adId", BANNER_ID);
        Context context = getContext();
        if (context == null || !(context instanceof android.app.Activity)) {
            JSObject result = new JSObject();
            result.put("value", false);
            call.resolve(result);
            return;
        }

        try {
            runOnUi(() -> showBannerInternal((android.app.Activity) context, adId));
            JSObject result = new JSObject();
            result.put("value", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "showBanner error", e);
            call.reject(e.getMessage(), e);
        }
    }

    private void showBannerInternal(android.app.Activity activity, String adId) {
        try {
            if (bannerView != null) {
                ViewGroup parent = (ViewGroup) bannerView.getParent();
                if (parent != null) parent.removeView(bannerView);
                bannerView.destroy();
                bannerView = null;
            }

            bannerView = new AdView(activity);
            bannerView.setAdUnitId(adId);
            bannerView.setAdSize(AdSize.SMART_BANNER);

            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
            );
            activity.addContentView(bannerView, params);

            AdRequest adRequest = new AdRequest.Builder().build();
            bannerView.loadAd(adRequest);
        } catch (Exception e) {
            Log.e(TAG, "showBannerInternal error", e);
        }
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        try {
            runOnUi(() -> {
                if (bannerView != null) {
                    ViewGroup parent = (ViewGroup) bannerView.getParent();
                    if (parent != null) parent.removeView(bannerView);
                    bannerView.destroy();
                    bannerView = null;
                }
            });
            JSObject result = new JSObject();
            result.put("value", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "hideBanner error", e);
            call.reject(e.getMessage(), e);
        }
    }

    @PluginMethod
    public void prepareRewardVideoAd(PluginCall call) {
        String adId = call.getString("adId", REWARD_ID);
        try {
            preloadRewardAdInternal(adId);
            JSObject result = new JSObject();
            result.put("value", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "prepareRewardVideoAd error", e);
            call.reject(e.getMessage(), e);
        }
    }

    private void preloadRewardAd() {
        preloadRewardAdInternal(REWARD_ID);
    }

    private void preloadRewardAdInternal(String adId) {
        if (rewardAdLoading) return;

        Context context = getContext();
        if (context == null || !(context instanceof android.app.Activity)) return;

        rewardAdLoading = true;
        AdRequest adRequest = new AdRequest.Builder().build();

        try {
            RewardedAd.load(context, adId, adRequest, new RewardedAdLoadCallback() {
                @Override
                public void onAdLoaded(RewardedAd ad) {
                    rewardedAd = ad;
                    rewardAdLoading = false;
                    try {
                        JSObject data = new JSObject();
                        notifyListeners("onRewardedVideoAdLoaded", data);
                    } catch (Exception e) {
                        Log.e(TAG, "notifyListeners error", e);
                    }
                }

                @Override
                public void onAdFailedToLoad(LoadAdError error) {
                    rewardAdLoading = false;
                    rewardedAd = null;
                    try {
                        JSObject data = new JSObject();
                        data.put("error", error != null ? error.getMessage() : "unknown");
                        notifyListeners("onRewardedVideoAdFailedToLoad", data);
                    } catch (Exception e) {
                        Log.e(TAG, "notifyListeners error", e);
                    }
                }
            });
        } catch (Exception e) {
            rewardAdLoading = false;
            Log.e(TAG, "preloadRewardAd error", e);
        }
    }

    @PluginMethod
    public void showRewardVideoAd(PluginCall call) {
        Context context = getContext();
        if (context == null || !(context instanceof android.app.Activity)) {
            JSObject result = new JSObject();
            result.put("value", false);
            call.resolve(result);
            return;
        }

        android.app.Activity activity = (android.app.Activity) context;

        if (rewardedAd == null) {
            preloadRewardAd();
            JSObject result = new JSObject();
            result.put("value", false);
            call.resolve(result);
            return;
        }

        try {
            runOnUi(() -> {
                rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                    @Override
                    public void onAdDismissedFullScreenContent() {
                        try {
                            JSObject data = new JSObject();
                            notifyListeners("onRewardedVideoAdClosed", data);
                        } catch (Exception e) {
                            Log.e(TAG, "notifyListeners error", e);
                        }
                        preloadRewardAd();
                    }

                    @Override
                    public void onAdFailedToShowFullScreenContent(AdError error) {
                        try {
                            JSObject data = new JSObject();
                            data.put("error", error != null ? error.getMessage() : "unknown");
                            notifyListeners("onRewardedVideoAdFailedToLoad", data);
                        } catch (Exception e) {
                            Log.e(TAG, "notifyListeners error", e);
                        }
                        preloadRewardAd();
                    }
                });

                rewardedAd.show(activity, (RewardItem rewardItem) -> {
                    try {
                        JSObject data = new JSObject();
                        notifyListeners("onRewarded", data);
                    } catch (Exception e) {
                        Log.e(TAG, "notifyListeners error", e);
                    }
                });
            });

            JSObject result = new JSObject();
            result.put("value", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "showRewardVideoAd error", e);
            JSObject result = new JSObject();
            result.put("value", false);
            call.resolve(result);
        }
    }

    private void runOnUi(Runnable action) {
        new Handler(Looper.getMainLooper()).post(action);
    }

    @Override
    protected void handleOnDestroy() {
        try {
            if (bannerView != null) {
                bannerView.destroy();
                bannerView = null;
            }
        } catch (Exception e) {
            Log.e(TAG, "handleOnDestroy error", e);
        }
        rewardedAd = null;
        super.handleOnDestroy();
    }
}
