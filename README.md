# Website Time Limit Extension

A chrome extension to limit time the user is allowed to spend on a website to improve efficiency.
The idea comes from the inability of Apple's Screen Time function in settings to limit websites visited on Chrome. I personally use Chrome because it transfers information between my computer and phone well, so I found it necessary to control my YouTube surfing. Instead of limiting by total time spent, which is kind of frustrating when you're watching a Top Gear highlight then suddenly your website is blocked, this extension limits WHEN you can access website, so you're forced to do work or sports or anything productive.

Since the Git is public, all changes are welcome!

## Core Functions

### 🚫 Time Limit settings
- can set multiple limited websites
- limit access time span on each website
- limit days of the week
- password lock/unlock (work in progress)

### 📊 Time-on-website Statistics Display (work in progress)
- categories of websites
- live tracking of time-on-website for ALL websites, not just the limited ones
- visualisation: pie chart of time in each category of websites
- resetting statistics

## Categories of Websites

Extension automatically contains following categories (can be expanded):

| Categories | Websites |
|------|-------------|
| social media | Facebook, Twitter, Instagram |
| Entertainment | Hulu, Netflix, YouTube, TikTok, ESPN/ |
| Workflow | LinkedIn, GitHub Google, Stack Overflow, Wikipedia |
| Shopping | Amazon, Temu |
| News | CNN, BBC, NPR, CNBC |
| Others | uncategorised websites |

## Installatioin

1. download or clone Git file
2. click on the extension icon
3. click Manage Extensions
4. turn on Developer mode on the top right
5. click Load Unpacked on the top left
6. choose the Git file
7. click extension icon again once upload is successful
8. click the extension to open the popup window

## Code Structure

```
Extension/
├── manifest.json         # structure and basic information of the extension
├── background.js         # coordinates information exchange and core functions
├── popup/                # extension popup window
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/              # extension settings window
│   ├── options.html
│   ├── options.css
│   └── options.js
├── icons/                # graphics
├── blocked.html          # website blocked page
└── blocked.js
```

## Privacy

- all data stored in Local storage of the browser
- no servers or external storage involved
- all data can be deleted at any time

## License

MIT License