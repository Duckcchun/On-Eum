import UIKit
import React

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

  var window: UIWindow?

  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    let jsCodeLocation: URL
    #if DEBUG
      if let bundleURL = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index") {
        jsCodeLocation = bundleURL
      } else {
        // Fallback to localhost if bundle provider fails
        jsCodeLocation = URL(string: "http://localhost:8081/index.bundle?platform=ios")!
      }
    #else
      if let bundleURL = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
        jsCodeLocation = bundleURL
      } else {
        // Fallback to development server if bundle not found
        if let devURL = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index") {
          jsCodeLocation = devURL
        } else {
          jsCodeLocation = URL(string: "http://localhost:8081/index.bundle?platform=ios")!
        }
      }
    #endif

    let rootView = RCTRootView(
      bundleURL: jsCodeLocation,
      moduleName: "OnEum",
      initialProperties: nil,
      launchOptions: launchOptions
    )
    
    let rootViewController = UIViewController()
    rootViewController.view = rootView

    self.window = UIWindow(frame: UIScreen.main.bounds)
    self.window?.rootViewController = rootViewController
    self.window?.makeKeyAndVisible()
    
    return true
  }
}
