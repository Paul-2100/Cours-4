# AI Image Editor

This project is an AI-powered image editor built with Next.js. It allows users to upload images, input prompts, and generate new images using AI models. The application is designed to be modern, clean, and user-friendly.

## Features

- Image upload functionality
- Prompt input for image generation
- Display of generated images
- Loading state during image processing
- Responsive design

## Getting Started

To get started with the AI Image Editor, follow these steps:

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```
   cd ai-image-editor
   ```

3. Install the dependencies:

   ```
   npm install
   ```

### Environment Variables

Create a `.env.local` file in the root of the project and add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
REPLICATE_API_TOKEN=<your-replicate-api-token>
```

### Running the Application

To run the application in development mode, use the following command:

```
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to view the application.

### Building for Production

To build the application for production, use the following command:

```
npm run build
```

After building, you can start the production server with:

```
npm start
```

## Usage

1. Upload an image using the upload button.
2. Enter a prompt in the provided textarea.
3. Click the "Generate" button to create a new image based on the uploaded image and prompt.
4. View the generated image displayed on the screen.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.