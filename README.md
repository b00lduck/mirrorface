# MirrorFace

A React-based web application for creating symmetrical mirror effects on images. Upload or paste an image URL, crop it, position a mirror line, and generate a mirrored result where the right side reflects the left.

## Features

- 📤 **Image Upload**: Upload images from your device or paste a URL
- ✂️ **Interactive Cropping**: Draggable and resizable crop rectangle
- 📏 **Mirror Line Control**: Adjustable vertical line to set the mirror position
- 🪞 **Mirror Effect**: Left side shows original pixels, right side displays a horizontal mirror
- ⚡ **Real-time Processing**: Canvas-based image processing with instant preview
- 🎨 **Modern UI**: Gradient backgrounds with glassmorphism effects

## Demo

Live demo: [https://b00lduck.github.io/mirrorface/](https://b00lduck.github.io/mirrorface/)

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Canvas API** - Image manipulation
- **pnpm** - Package manager

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm (install with `npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone https://github.com/b00lduck/mirrorface.git
cd mirrorface

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
pnpm run build
```

The built files will be in the `dist/` directory.

## Usage

1. **Upload an Image**: Click the upload button or paste an image URL
2. **Crop (Step 1)**: Drag and resize the green rectangle to select the area to process
3. **Set Mirror Line (Step 2)**: Use the slider to position the vertical mirror line
4. **View Result (Step 3)**: See the final mirrored image (left original, right mirrored)

## Project Structure

```
src/
├── components/
│   ├── ImageUpload.tsx      # File upload button
│   └── MirrorImage.tsx       # Mirror effect processing hook
├── pages/
│   ├── Home.tsx              # Main application
│   ├── About.tsx             # About page
│   └── Imprint.tsx           # Imprint page
├── App.tsx                   # Router setup
└── main.tsx                  # Entry point
```

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
