#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(AudioRouteManager, RCTEventEmitter)

RCT_EXTERN_METHOD(getCurrentRoute:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(checkMicrophonePermission:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(requestMicrophonePermission:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

@end
