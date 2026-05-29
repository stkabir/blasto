package pro.blasto.game;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
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

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "BlastoAdMob")
public class AdMobPlugin extends Plugin {

    private static final String TAG = "BlastoAdMob";
    private static final String BANNER_ID = "ca-app-pub-2603532225773045/1397910983";
    private static final String REWARD_ID = "ca-app-pub-2603532225773045/8696982352";
    private static final long REWARD_WAIT_TIMEOUT_MS = 5000;

    private AdView bannerView;
    private FrameLayout bannerContainer;
    private String currentBannerAdId;
    private RewardedAd rewardedAd;
    private boolean rewardAdLoading = false;
    private boolean sdkInitialized = false;
    private boolean sdkInitStarted = false;
    private final List<Runnable> pendingActions = new ArrayList<>();

    @Override
    public void load() {
        super.load();
        initSdk();
    }

    private void initSdk() {
        if (sdkInitialized || sdkInitStarted) return;
        Context ctx = getContext();
        if (ctx == null) return;
        sdkInitStarted = true;

        try {
            MobileAds.initialize(ctx, status -> {
                sdkInitialized = true;
                Log.d(TAG, "AdMob SDK initialized");
                runOnUi(() -> {
                    List<Runnable> toRun;
                    synchronized (pendingActions) {
                        toRun = new ArrayList<>(pendingActions);
                        pendingActions.clear();
                    }
                    for (Runnable r : toRun) {
                        try { r.run(); } catch (Exception e) { Log.e(TAG, "pending action failed", e); }
                    }
                    preloadRewardAd();
                });
            });
        } catch (Exception e) {
            sdkInitStarted = false;
            Log.e(TAG, "AdMob init failed", e);
        }
    }

    private void whenReady(Runnable action) {
        if (sdkInitialized) {
            runOnUi(action);
            return;
        }
        synchronized (pendingActions) {
            pendingActions.add(action);
        }
        initSdk();
    }

    private Activity safeGetActivity() {
        Context ctx = getContext();
        if (ctx instanceof Activity) return (Activity) ctx;
        return null;
    }

    @PluginMethod
    public void showBanner(PluginCall call) {
        try {
            Activity activity = safeGetActivity();
            if (activity == null) { call.reject("Activity not available"); return; }

            String adId = call.getString("adId", BANNER_ID);
            whenReady(() -> showBannerInternal(activity, adId));

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
            if (bannerView != null && bannerContainer != null && adId.equals(currentBannerAdId)) {
                bannerContainer.setVisibility(View.VISIBLE);
                if (bannerContainer.getParent() == null) {
                    activity.addContentView(bannerContainer,
                        new FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        ));
                }
                return;
            }

            if (bannerView != null) {
                if (bannerContainer != null) {
                    try {
                        ViewGroup parent = (ViewGroup) bannerContainer.getParent();
                        if (parent != null) parent.removeView(bannerContainer);
                    } catch (Exception e) { }
                }
                bannerView.destroy();
                bannerView = null;
                bannerContainer = null;
            }

            int widthDp = activity.getResources().getConfiguration().screenWidthDp;
            AdSize adSize = AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(activity, widthDp);

            bannerView = new AdView(activity);
            bannerView.setAdUnitId(adId);
            bannerView.setAdSize(adSize);
            bannerView.setAdListener(new com.google.android.gms.ads.AdListener() {
                @Override public void onAdLoaded() {
                    Log.d(TAG, "Banner loaded");
                }
                @Override public void onAdFailedToLoad(LoadAdError error) {
                    Log.w(TAG, "Banner failed code=" + error.getCode() + " msg=" + error.getMessage());
                }
            });

            bannerContainer = new FrameLayout(activity);
            FrameLayout.LayoutParams adParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
            );
            bannerContainer.addView(bannerView, adParams);
            bannerContainer.setElevation(10);

            activity.addContentView(bannerContainer,
                new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                ));

            AdRequest adRequest = new AdRequest.Builder().build();
            bannerView.loadAd(adRequest);
            currentBannerAdId = adId;
            Log.d(TAG, "Banner requested: " + adId + " size=" + adSize);
        } catch (Exception e) {
            Log.e(TAG, "showBannerInternal", e);
        }
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        try {
            runOnUi(() -> {
                if (bannerContainer != null) {
                    bannerContainer.setVisibility(View.GONE);
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
            String adId = call.getString("adId", REWARD_ID);
            whenReady(() -> preloadRewardAdInternal(adId));
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
        if (rewardAdLoading || rewardedAd != null) return;

        Activity activity = safeGetActivity();
        if (activity == null) return;

        rewardAdLoading = true;
        AdRequest adRequest = new AdRequest.Builder().build();
        Log.d(TAG, "Loading reward ad: " + adId);

        try {
            RewardedAd.load(activity, adId, adRequest, new RewardedAdLoadCallback() {
                @Override
                public void onAdLoaded(RewardedAd ad) {
                    rewardedAd = ad;
                    rewardAdLoading = false;
                    Log.d(TAG, "Reward ad loaded");
                    tryNotify("onRewardedVideoAdLoaded", new JSObject());
                }

                @Override
                public void onAdFailedToLoad(LoadAdError error) {
                    rewardAdLoading = false;
                    rewardedAd = null;
                    Log.w(TAG, "Reward ad failed code=" + (error != null ? error.getCode() : -1)
                        + " msg=" + (error != null ? error.getMessage() : "unknown"));
                    JSObject data = new JSObject();
                    data.put("error", error != null ? error.getMessage() : "unknown");
                    data.put("code", error != null ? error.getCode() : -1);
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
            if (activity == null) { call.reject("Activity not available"); return; }

            whenReady(() -> tryShowReward(activity, call, 0));
        } catch (Exception e) {
            Log.e(TAG, "showRewardVideoAd", e);
            call.reject(e.getMessage());
        }
    }

    private void tryShowReward(Activity activity, PluginCall call, long waitedMs) {
        if (rewardedAd != null) {
            presentReward(activity, call);
            return;
        }
        if (!rewardAdLoading && waitedMs == 0) {
            preloadRewardAd();
        }
        if (waitedMs >= REWARD_WAIT_TIMEOUT_MS) {
            Log.w(TAG, "Reward ad timeout waiting load");
            JSObject data = new JSObject();
            data.put("error", "timeout");
            tryNotify("onRewardedVideoAdFailedToLoad", data);
            JSObject result = new JSObject();
            result.put("value", false);
            call.resolve(result);
            return;
        }
        new Handler(Looper.getMainLooper()).postDelayed(
            () -> tryShowReward(activity, call, waitedMs + 250), 250);
    }

    private void presentReward(Activity activity, PluginCall call) {
        try {
            rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override
                public void onAdShowedFullScreenContent() {
                    tryNotify("onRewardedVideoAdShowing", new JSObject());
                }
                @Override
                public void onAdDismissedFullScreenContent() {
                    rewardedAd = null;
                    tryNotify("onRewardedVideoAdClosed", new JSObject());
                    preloadRewardAd();
                }
                @Override
                public void onAdFailedToShowFullScreenContent(AdError error) {
                    rewardedAd = null;
                    JSObject data = new JSObject();
                    data.put("error", error != null ? error.getMessage() : "unknown");
                    tryNotify("onRewardedVideoAdFailedToLoad", data);
                    preloadRewardAd();
                }
            });
            rewardedAd.show(activity, (RewardItem rewardItem) -> {
                Log.d(TAG, "User earned reward");
                tryNotify("onRewarded", new JSObject());
            });
            JSObject result = new JSObject();
            result.put("value", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "presentReward", e);
            call.reject(e.getMessage());
        }
    }

    private void tryNotify(String event, JSObject data) {
        try { notifyListeners(event, data); }
        catch (Exception e) { Log.e(TAG, "notify error: " + event, e); }
    }

    private void runOnUi(Runnable action) {
        new Handler(Looper.getMainLooper()).post(action);
    }

    @Override
    protected void handleOnDestroy() {
        try {
            if (bannerView != null) { bannerView.destroy(); bannerView = null; }
            bannerContainer = null;
            currentBannerAdId = null;
        } catch (Exception e) { Log.e(TAG, "handleOnDestroy", e); }
        rewardedAd = null;
        super.handleOnDestroy();
    }
}
