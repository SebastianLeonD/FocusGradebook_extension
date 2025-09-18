Simulate potential grades with hypothetical assignments in Focus Gradebook.

# Focus Grade Calculator

A Chrome extension that allows students to simulate hypothetical assignments and see how they would impact their overall grade in the Focus Gradebook system.

## Features

- 💡 **Add custom assignments** with earned and total points
- 📊 **Supports both weighted and unweighted** grading modes with auto-detection
- 🎯 **Instantly updates grade** based on what-if scenarios
- 🚫 **Does not alter actual grade data** — safe and private
- 🎓 **GPA Calculator** - Calculate projected GPAs based on current grades
- 🎨 **Multiple Themes** - Choose from different popup themes
- ✏️ **Undo/Redo** - Easy management of hypothetical assignments

## How It Works

1. Open the extension from the Chrome toolbar
2. Extension automatically detects if your class is **Weighted** or **Unweighted**
3. Enter the details of a hypothetical assignment (points, category if needed)
4. See your recalculated grade instantly!

## Installation

1. Clone or download this repository
2. Go to `chrome://extensions` in your browser
3. Enable "Developer Mode" (top right)
4. Click **"Load unpacked"** and select the folder
5. Open the extension from the toolbar

## How to Use

### Grade Calculator
1. **Open your Focus gradebook** in any class
2. **Click the extension icon** in your browser toolbar
3. **Select "Calculate grades"** from the popup
4. **Enter assignment details:**
   - Assignment name (optional)
   - Points earned
   - Points possible
   - Category (auto-detected for weighted classes)
5. **Click "Add Assignment"** to see your new grade!

### GPA Calculator
1. **Navigate to your main grades page** in Focus
2. **Click the extension icon**
3. **Select "GPA Calculator"**
4. **Review auto-selected classes** (modify if needed)
5. **Click "Calculate GPA"** to see projected results

## Special Use Cases

### Fixing Missing Assignments
If you have a 0/100 assignment that should be 85/100:
- Enter: **Points Earned: 85**, **Points Possible: 0**
- This adds the missing 85 points without extra total points

### "What If" Scenarios  
To see what your grade would be if you improved a 60/100 to 85/100:
- Enter: **Points Earned: 25**, **Points Possible: 0**
- This adds the 25 missing points (85-60=25)

### Adding New Assignments
To add a completely new assignment worth 90/100:
- Enter: **Points Earned: 90**, **Points Possible: 100**

## Privacy & Security

- ✅ **100% Local Processing**: All calculations happen in your browser
- ✅ **No Data Collection**: We don't store or transmit your grades
- ✅ **No Personal Information**: No names, emails, or login credentials collected
- ✅ **Anonymous Feedback**: Optional feedback system is completely anonymous
- ✅ **Secure**: Only works on Focus gradebook pages

See our [Privacy Policy](privacy-policy.html) for full details.

## Technical Requirements

- **Browser**: Chrome, Edge, or other Chromium-based browsers
- **Website**: Focus School Software gradebook system
- **Permissions**: 
  - `activeTab`: Read gradebook content when extension is used
  - `host_permissions`: Only works on Focus domains

## Supported Focus Features

- ✅ Weighted and unweighted gradebooks  
- ✅ Multiple assignment categories
- ✅ All standard grading scales (A-F)
- ✅ Percentage and letter grade displays
- ✅ Multiple classes and periods
- ✅ Quarter and semester grades

## Version History

### Version 1.6.1 (Current)
- Enhanced privacy protection
- Improved GPA calculation accuracy
- Better mobile responsiveness
- Fixed theme switching issues

### Version 1.6.0
- Added GPA Calculator feature
- Multiple popup themes
- Anonymous feedback system
- Improved auto-detection

### Version 1.5.0
- Auto-detection of weighted vs unweighted classes
- Enhanced UI with better mobile support
- Undo/Redo functionality

## Development

### Project Structure
```
focus-grade-calculator/
├── manifest.json              # Extension manifest
├── background.js             # Service worker
├── content-main.js           # Main content script
├── content-calculations.js   # Grade calculation logic
├── content-gpa-calculator.js # GPA calculation features
├── content-utilities.js      # Utility functions
├── popup-html.js            # HTML templates
├── popup-css.js             # CSS styles
├── theme-system.js          # Theme management
├── feedback-system.js       # Anonymous feedback
├── help-modal-html.js       # Help documentation
├── help-modal-css.js        # Help modal styles
└── icons/                   # Extension icons
```

### Building
This extension uses vanilla JavaScript with no build process required. Simply load the folder as an unpacked extension in Chrome.

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

### Getting Help
- 📖 **Built-in Help**: Click the "?" button in the extension popup
- 📧 **Direct Support**: focusgrades.feedback@gmail.com
- 💬 **Anonymous Feedback**: Use the feedback box in the extension

### Common Issues
- **Extension not showing**: Make sure you're on a Focus gradebook page
- **GPA Calculator empty**: Navigate to your main grades page in Focus
- **Calculations seem wrong**: Verify you're entering the correct point values

### Troubleshooting
1. **Refresh the Focus page** and try again
2. **Check that you're on the correct Focus page** (gradebook or grades)
3. **Disable other extensions** temporarily to check for conflicts
4. **Contact support** with specific details about the issue

## License

This project is **not open-source**. Code is provided for **personal, non-commercial use only**.  
Modification, redistribution, or commercial use is **not permitted** without permission.  
See [LICENSE](LICENSE) for full details.

---

**Copyright © Sebastian Leon 2025**