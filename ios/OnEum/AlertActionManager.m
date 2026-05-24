#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AlertActionManager, NSObject)

RCT_EXTERN_METHOD(triggerHaptic)
RCT_EXTERN_METHOD(playWarningWithDucking)
RCT_EXTERN_METHOD(restoreAudio)

@end
