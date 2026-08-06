#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(AudioBufferManager, RCTEventEmitter)

RCT_EXTERN_METHOD(startListening)
RCT_EXTERN_METHOD(stopListening)

@end
