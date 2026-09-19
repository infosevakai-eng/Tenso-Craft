import carParking from "../assets/images/solution-car-parking.webp";
import tensileRoofing from "../assets/images/solution-tensile-roofing.webp";
import walkwaysCanopies from "../assets/images/solution-walkways-canopies.webp";
import architectural from "../assets/images/solution-architectural.webp";
import membrane from "../assets/images/solution-membrane.webp";

// Real photos for the Home page "Our Solutions" strip. Used as a fallback
// until the admin panel has real Firestore `solutions` docs (Phase 7) --
// see src/components/home/SolutionsGrid.jsx.
export const homeSolutions = [
  {
    slug: "car-parking-shades",
    title: "Car Parking Shades",
    description: "Stylish, strong, practical shading for car parks.",
    image: carParking,
  },
  {
    slug: "tensile-roofing-systems",
    title: "Tensile Roofing Systems",
    description: "Large-span fabric roofing for open and semi-open spaces.",
    image: tensileRoofing,
  },
  {
    slug: "walkways-canopies",
    title: "Walkways & Canopies",
    description: "Covered paths that keep people dry and shaded.",
    image: walkwaysCanopies,
  },
  {
    slug: "architectural-structures",
    title: "Architectural Structures",
    description: "Iconic tensile designs for modern spaces.",
    image: architectural,
  },
  {
    slug: "membrane-structures",
    title: "Membrane Structures",
    description: "Engineered fabric membranes built for performance.",
    image: membrane,
  },
];