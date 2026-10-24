export function GET() {
  return Response.json(
    {
      name: "Consultorio",
      short_name: "Consultorio",
      start_url: "/consultorio",
      scope: "/consultorio",
      display: "standalone",
      background_color: "#f4f8fb",
      theme_color: "#2c7bb7",
      icons: [
        {
          src: "https://res.cloudinary.com/dzoupwn0e/image/upload/v1754952285/logo_salud_dental_verde_ndyrmh.webp",
          sizes: "192x192",
          type: "image/webp",
          purpose: "any",
        },
      ],
    },
    {
      headers: { "Content-Type": "application/manifest+json" },
    },
  );
}
