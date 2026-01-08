# Page snapshot

```yaml
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
```