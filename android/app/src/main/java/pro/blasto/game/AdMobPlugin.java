package pro.blasto.game;

import android.app.Activity;
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

@CapacitorPlugin(name = "BlastoAdMob")
public class AdMobPlugin extends Plugin {

    private static final String TAG = "BlastoAdMob";
    private static final String BANNER_ID = "ca-app-pub-2603532225773045/1397910983";
    private static final String REWARD_ID = "ca-app-pub-2603532225773045/8696982352";

    private AdView bannerView;
    private RewardedAd rewardedAd;
    private boolean rewardAdLoading = false;
    private boolean sdkInitialized = false;

    @Override
    public void load() {
    }

    private boolean ensureSdkInitialized() {
        if (sdkInitialized) return true;

        Context context = getContext();
        if (context == null) return false;

        try {
            MobileAds.initialize(context, status -> {
                sdkInitialized = true;
                Log.d(TAG, "AdMob initialized");
                preloadRewardAd();
            });
            return true;
        } catch (Exception e) {
            Log.e(TAG, "AdMob init failed", e);
            return false;
        }
    }

    private Activity safeGetActivity() {
        Context context = getContext();
        if (context instanceof Activity) {
            return (Activity) context;
        }
        return null;
    }

    @PluginMethod
    public void showBanner(PluginCall call) {
        try {
            Activity activity = safeGetActivity();
            if (activity == null) {
                call.reject("Activity not available");
                return;
            }
            ensureSdkInitialized();

            String adId = call.getString("adId", BANNER_ID);
            runOnUi(() -> showBannerInternal(activity, adId));

            JSObject result = new JSObject();
            result.put("value", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "showBanner", e);
            call.reject(e.getMessage());
        }
    }

    private void showBannerInternal(Activity activity, String adId) {
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
            Log.e(TAG, "showBannerInternal", e);
        }
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        try {
            runOnUi(() -> {
                if (bannerView != null) {
                    try {
                        ViewGroup parent = (ViewGroup) bannerView.getParent();
                        if (parent != null) parent.removeView(bannerView);
                        bannerView.destroy();
                    } catch (Exception e) {
                        Log.e(TAG, "hideBanner cleanup", e);
                    }
                    bannerView = null;
                }
            });
            JSObject result = new JSObject();
            result.put("value", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "hideBanner", e);
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void prepareRewardVideoAd(PluginCall call) {
        try {
            ensureSdkInitialized();
            String adId = call.getString("adId", REWARD_ID);
            preloadRewardAdInternal(adId);
            JSObject result = new JSObject();
            result.put("value", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "prepareRewardVideoAd", e);
            call.reject(e.getMessage());
        }
    }

    private void preloadRewardAd() {
        preloadRewardAdInternal(REWARD_ID);
    }

    private void preloadRewardAdInternal(String adId) {
        if (rewardAdLoading) return;

        Activity activity = safeGetActivity();
        if (activity == null) return;

        rewardAdLoading = true;
        AdRequest adRequest = new AdRequest.Builder().build();

        try {
            RewardedAd.load(activity, adId, adRequest, new RewardedAdLoadCallback() {
                @Override
                public void onAdLoaded(RewardedAd ad) {
                    rewardedAd = ad;
                    rewardAdLoading = false;
                    tryNotify("onRewardedVideoAdLoaded", new JSObject());
                }

                @Override
                public void onAdFailedToLoad(LoadAdError error) {
                    rewardAdLoading = false;
                    rewardedAd = null;
                    JSObject data = new JSObject();
                    data.put("error", error != null ? error.getMessage() : "unknown");
                    tryNotify("onRewardedVideoAdFailedToLoad", data);
                }
            });
        } catch (Exception e) {
            rewardAdLoading = false;
            Log.e(TAG, "preloadRewardAd", e);
        }
    }

    @PluginMethod
    public void showRewardVideoAd(PluginCall call) {
        try {
            Activity activity = safeGetActivity();
            if (activity == null) {
                call.reject("Activity not available");
                return;
            }

            ensureSdkInitialized();

            if (rewardedAd == null) {
                preloadRewardAd();
                JSObject result = new JSObject();
                result.put("value", false);
                call.resolve(result);
                return;
            }

            runOnUi(() -> {
                try {
                    rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                        @Override
                        public void onAdDismissedFullScreenContent() {
                            tryNotify("onRewardedVideoAdClosed", new JSObject());
                            preloadRewardAd();
                        }

                        @Override
                        public void onAdFailedToShowFullScreenContent(AdError error) {
                            JSObject data = new JSObject();
                            data.put("error", error != null ? error.getMessage() : "unknown");
                            tryNotify("onRewardedVideoAdFailedToLoad", data);
                            preloadRewardAd();
                        }
                    });

                    rewardedAd.show(activity, (RewardItem rewardItem) -> {
                        tryNotify("onRewarded", new JSObject());
                    });
                } catch (Exception e) {
                    Log.e(TAG, "showRewardVideoAd internal", e);
                }
            });

            JSObject result = new JSObject();
            result.put("value", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "showRewardVideoAd", e);
            call.reject(e.getMessage());
        }
    }

    private void tryNotify(String event, JSObject data) {
        try {
            notifyListeners(event, data);
        } catch (Exception e) {
            Log.e(TAG, "notify error: " + event, e);
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
            Log.e(TAG, "handleOnDestroy", e);
        }
        rewardedAd = null;
        super.handleOnDestroy();
    }
}
