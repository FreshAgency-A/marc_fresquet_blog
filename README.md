# Marc Fresquet — Movimiento, salud y rendimiento

Sitio web personal inicial para un estudiante de Ciencias de la Actividad Física y del Deporte (CAFYD). Incluye el proyecto **Ejercicio físico para la calidad de vida**, con 45 fichas de ejercicios y tres cuestionarios interactivos.

## Estructura

```text
marc_fresquet_web/
├── index.html
├── assets/
│   ├── css/styles.css
│   └── js/
│       ├── data.js       # Ejercicios, fichas y preguntas editables
│       └── app.js        # Interfaz, filtros y funcionamiento de cuestionarios
├── videos/
│   ├── superiores/       # 15 vídeos incorporados
│   ├── inferiores/       # 15 vídeos incorporados
│   └── globales/         # 15 vídeos incorporados
├── investigaciones/      # Futuras investigaciones y trabajos académicos
├── recursos/             # Guías, lecturas y herramientas
└── documentacion/        # Documentación del sitio y fuentes
```

## Cómo abrir la web

1. Descomprime la carpeta.
2. Abre `index.html` con Chrome, Safari, Firefox o Edge.
3. La web funciona como sitio estático; no necesita instalación ni servidor para la vista previa local.

La tipografía se carga desde Google Fonts cuando hay conexión a internet. Sin conexión, se utilizarán fuentes de reserva.

## Cómo incorporar los vídeos

Cada ejercicio está en `assets/js/data.js`. Busca el identificador del ejercicio, por ejemplo `sup-01`, y añade un campo `videoUrl`:

```js
{
  id: 'sup-01',
  category: 'superiores',
  name: 'Flexión en pared',
  // ...resto de campos...
  videoUrl: 'videos/superiores/01-flexion-pared.mp4'
}
```

También se admiten enlaces de inserción de YouTube como `https://www.youtube.com/embed/ID_DEL_VIDEO` y enlaces de reproductor de Vimeo. Si se usa un archivo local, guárdalo dentro de la carpeta de su categoría y utiliza una ruta relativa.

Nombres recomendados para los archivos:
- `videos/superiores/01-sup-01.mp4` hasta `15-sup-15.mp4`
- `videos/inferiores/01-inf-01.mp4` hasta `15-inf-15.mp4`
- `videos/globales/01-glo-01.mp4` hasta `15-glo-15.mp4`

## Cuestionarios

Los tres cuestionarios ya están integrados. Cada uno tiene 10 preguntas con cuatro opciones, una respuesta correcta, explicación inmediata, puntuación final y una pregunta de reflexión. Las respuestas de los usuarios no se envían ni almacenan en ningún servidor.

## Publicación

Para compartir la web mediante una URL pública será necesario publicarla en un servicio de alojamiento estático (por ejemplo, GitHub Pages, Netlify o similar). La carpeta entregada contiene los archivos de la web; todavía no está publicada en internet.

## Fuentes académicas de partida

- Material docente de la asignatura Actividad Física y Calidad de Vida, Tema 6: patrones de movimiento, entrenamiento funcional y transferencia.
- Material docente de la asignatura Actividad Física y Calidad de Vida, Tema 7: fundamentos para el uso de materiales y resistencia elástica.

Las fichas son material divulgativo de apoyo y deben revisarse junto con las instrucciones definitivas de la actividad antes de su entrega.
