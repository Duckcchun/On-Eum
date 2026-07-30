import UIKit
import React

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

  var window: UIWindow?

  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    let jsCodeLocation: URL
    #if DEBUG
      jsCodeLocation = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
      if let bundleURL = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
        jsCodeLocation = bundleURL
      } else {
        // Fallback to development server if bundle not found
        jsCodeLocation = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
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
