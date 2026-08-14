#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(WatchSessionManager, RCTEventEmitter)

RCT_EXTERN_METHOD(sendThreatAlert:(NSString *)type icon:(NSString *)icon severity:(NSString *)severity direction:(double)direction detectedAt:(NSString *)detectedAt)
RCT_EXTERN_METHOD(syncProtectionState:(BOOL)isActive)
RCT_EXTERN_METHOD(syncDetectionCount:(int)count)
RCT_EXTERN_METHOD(sendDismiss)
RCT_EXTERN_METHOD(getWatchStatus:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

@end
