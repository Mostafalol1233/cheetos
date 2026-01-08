# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - region "Notifications (F8)":
      - list
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: Admin Login
        - generic [ref=e8]: Access the Diaa Eldeen admin dashboard
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]:
            - text: Email Address
            - textbox "Email Address" [ref=e12]:
              - /placeholder: admin@diaaldeen.com
          - generic [ref=e13]:
            - text: Password
            - textbox "Password" [ref=e14]:
              - /placeholder: ••••••••
          - button "Login" [disabled]
        - button "Login with QR" [ref=e16] [cursor=pointer]
        - paragraph [ref=e17]: Protected admin area. Unauthorized access is prohibited.
    - button [ref=e19] [cursor=pointer]:
      - img [ref=e20]
  - generic [ref=e24]:
    - generic [ref=e25]: URI malformed
    - generic [ref=e26]: at decodeURI (<anonymous>) at viteTransformMiddleware (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:62023:13) at call (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41364:7) at next (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41308:5) at viteServePublicMiddleware (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:51663:14) at call (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41364:7) at next (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41308:5) at viteHMRPingMiddleware (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:63353:7) at call (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41364:7) at next (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41308:5) at next (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41286:14) at viteProxyMiddleware (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:61862:5) at call (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41364:7) at next (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41308:5) at viteCachedTransformMiddleware (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:62010:5) at call (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41364:7) at next (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41308:5) at cors (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41836:7) at file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41872:17 at originCallback (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41862:15) at file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41867:13 at optionsCallback (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41847:9) at corsMiddleware (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41852:7) at call (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41364:7) at next (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41308:5) at viteRejectInvalidRequestMiddleware (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:62991:12) at call (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41364:7) at next (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41308:5) at Function.handle (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41311:3) at Server.app (file:///D:/GameCart-1/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:41176:37
    - generic [ref=e27]:
      - text: Click outside, press Esc key, or fix the code to dismiss.
      - text: You can also disable this overlay by setting
      - code [ref=e28]: server.hmr.overlay
      - text: to
      - code [ref=e29]: "false"
      - text: in
      - code [ref=e30]: vite.config.ts
      - text: .
```