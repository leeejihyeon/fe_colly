#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RuntimeConfigModule : NSObject <RCTBridgeModule>
@end

@implementation RuntimeConfigModule

RCT_EXPORT_MODULE(RuntimeConfig)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSDictionary *)constantsToExport
{
  NSBundle *bundle = [NSBundle mainBundle];

  NSString *appEnv = [self stringValueForKey:@"COLLY_APP_ENV" inBundle:bundle fallback:@"dev"];
  NSString *apiBaseUrl = [self stringValueForKey:@"COLLY_API_BASE_URL" inBundle:bundle fallback:@""];
  NSString *googleWebClientId = [self stringValueForKey:@"COLLY_GOOGLE_WEB_CLIENT_ID" inBundle:bundle fallback:@""];
  NSString *googleIosClientId = [self stringValueForKey:@"COLLY_GOOGLE_IOS_CLIENT_ID" inBundle:bundle fallback:@""];

  return @{
    @"appEnv": appEnv,
    @"apiBaseUrl": apiBaseUrl,
    @"googleWebClientId": googleWebClientId,
    @"googleIosClientId": googleIosClientId,
  };
}

- (NSString *)stringValueForKey:(NSString *)key inBundle:(NSBundle *)bundle fallback:(NSString *)fallback
{
  id value = [bundle objectForInfoDictionaryKey:key];
  if ([value isKindOfClass:[NSString class]]) {
    NSString *trimmed = [(NSString *)value stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return fallback;
}

@end
