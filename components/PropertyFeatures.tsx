/**
 * Property Features Component
 *
 * Displays property features in an elegant grid layout.
 * Shows bedrooms, bathrooms, size, type, and special features.
 */

interface PropertyFeaturesProps {
  bedrooms: number | null;
  bathrooms: number | null;
  livingArea: number | null;
  priceEur: number;
  propertyType: string;
  hasSeaView?: boolean | null;
  hasGarden?: boolean | null;
  hasPool?: boolean | null;
  hasTerrace?: boolean | null;
  hasBalcony?: boolean | null;
  hasParking?: boolean | null;
  hasGarage?: boolean | null;
  hasFireplace?: boolean | null;
  hasAirConditioning?: boolean | null;
  hasElevator?: boolean | null;
  isRenovated?: boolean | null;
  hasMountainView?: boolean | null;
  hasPanoramicView?: boolean | null;
  floorNumber?: number | null;
  yearBuilt?: number | null;
  energyClass?: string | null;
}

/**
 * Property type display names (English)
 */
const propertyTypeLabels: Record<string, string> = {
  apartment: "Apartment",
  villa: "Villa",
  farmhouse: "Farmhouse",
  townhouse: "Townhouse",
  penthouse: "Penthouse",
  studio: "Studio",
  land: "Land",
  commercial: "Commercial",
  other: "Property",
};

export function PropertyFeatures({
  bedrooms,
  bathrooms,
  livingArea,
  priceEur,
  propertyType,
  hasSeaView,
  hasGarden,
  hasPool,
  hasTerrace,
  hasBalcony,
  hasParking,
  hasGarage,
  hasFireplace,
  hasAirConditioning,
  hasElevator,
  isRenovated,
  hasMountainView,
  hasPanoramicView,
  floorNumber,
  yearBuilt,
  energyClass,
}: PropertyFeaturesProps) {
  const typeLabel = propertyTypeLabels[propertyType] || "Property";

  // Build list of main features to display
  const features = [
    bedrooms !== null && {
      icon: <BedroomIcon />,
      label: "Bedrooms",
      value: bedrooms.toString(),
      sublabel: bedrooms === 1 ? "Bedroom" : "Bedrooms",
    },
    bathrooms !== null && {
      icon: <BathroomIcon />,
      label: "Bathrooms",
      value: bathrooms.toString(),
      sublabel: bathrooms === 1 ? "Bathroom" : "Bathrooms",
    },
    livingArea !== null && {
      icon: <AreaIcon />,
      label: "Living Area",
      value: `${livingArea} m²`,
      sublabel: "Living Area",
    },
    livingArea !== null && livingArea > 0 && {
      icon: <EuroIcon />,
      label: "Price per m²",
      value: `€${Math.round(priceEur / livingArea).toLocaleString("it-IT")}`,
      sublabel: "per m²",
    },
    {
      icon: <PropertyTypeIcon />,
      label: "Property Type",
      value: typeLabel,
      sublabel: "Type",
    },
    floorNumber !== null && floorNumber !== undefined && {
      icon: <FloorIcon />,
      label: "Floor",
      value: floorNumber === 0 ? "Ground" : floorNumber.toString(),
      sublabel: floorNumber === 0 ? "Ground Floor" : "Floor",
    },
    yearBuilt !== null && yearBuilt !== undefined && {
      icon: <YearIcon />,
      label: "Year Built",
      value: yearBuilt.toString(),
      sublabel: "Year Built",
    },
    energyClass && {
      icon: <EnergyIcon />,
      label: "Energy Class",
      value: energyClass,
      sublabel: "Energy Class",
    },
  ].filter(Boolean) as Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
    sublabel: string;
  }>;

  // Special features (views, outdoor, amenities)
  const specialFeatures = [
    // Views
    hasSeaView && {
      icon: <SeaViewIcon />,
      label: "Sea View",
      category: "view",
    },
    hasMountainView && {
      icon: <MountainViewIcon />,
      label: "Mountain View",
      category: "view",
    },
    hasPanoramicView && {
      icon: <PanoramicViewIcon />,
      label: "Panoramic View",
      category: "view",
    },
    // Outdoor
    hasGarden && {
      icon: <GardenIcon />,
      label: "Garden",
      category: "outdoor",
    },
    hasPool && {
      icon: <PoolIcon />,
      label: "Pool",
      category: "outdoor",
    },
    hasTerrace && {
      icon: <TerraceIcon />,
      label: "Terrace",
      category: "outdoor",
    },
    hasBalcony && {
      icon: <BalconyIcon />,
      label: "Balcony",
      category: "outdoor",
    },
    // Parking
    hasParking && {
      icon: <ParkingIcon />,
      label: "Parking",
      category: "parking",
    },
    hasGarage && {
      icon: <GarageIcon />,
      label: "Garage",
      category: "parking",
    },
    // Amenities
    hasFireplace && {
      icon: <FireplaceIcon />,
      label: "Fireplace",
      category: "amenity",
    },
    hasAirConditioning && {
      icon: <AirConditioningIcon />,
      label: "A/C",
      category: "amenity",
    },
    hasElevator && {
      icon: <ElevatorIcon />,
      label: "Elevator",
      category: "amenity",
    },
    isRenovated && {
      icon: <RenovatedIcon />,
      label: "Renovated",
      category: "amenity",
    },
  ].filter(Boolean) as Array<{
    icon: React.ReactNode;
    label: string;
    category: string;
  }>;

  return (
    <section className="bg-[var(--color-cream)] rounded-xl p-6 sm:p-8 border border-[var(--color-sand)]">
      <h2 className="font-display text-2xl text-[var(--color-text)] mb-6 flex items-center gap-3">
        <span className="w-8 h-0.5 bg-[var(--color-terracotta)]" />
        Property Details
      </h2>

      {/* Main Features Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-[var(--color-sand)] text-center"
          >
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-stone)] dark:bg-gray-600 mb-3">
              <span className="text-[var(--color-olive)] dark:text-gray-200">{feature.icon}</span>
            </div>
            <div className="font-display text-xl text-[var(--color-text)] mb-1">
              {feature.value}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {feature.sublabel}
            </div>
          </div>
        ))}
      </div>

      {/* Special Features */}
      {specialFeatures.length > 0 && (
        <div className="mt-6 pt-6 border-t border-[var(--color-sand)]">
          <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
            Special Features
          </h3>
          <div className="flex flex-wrap gap-3">
            {specialFeatures.map((feature, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-olive)]/10 dark:bg-gray-700 rounded-lg border border-[var(--color-olive)]/20 dark:border-gray-600"
              >
                <span className="text-[var(--color-olive)] dark:text-gray-200">{feature.icon}</span>
                <span className="text-sm font-medium text-[var(--color-olive-dark)] dark:text-gray-200">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// Icons
function BedroomIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 9.75h16.5m-16.5 0v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5m-16.5 0V8.25a3 3 0 013-3h3a3 3 0 013 3v1.5m0 0h6m-6 0v-1.5a3 3 0 013-3h3a3 3 0 013 3v1.5"
      />
    </svg>
  );
}

function BathroomIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 15h15m-15 0v3.75a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5V15m-15 0v-3a4.5 4.5 0 014.5-4.5h.75V6a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 011.5 1.5v1.5h.75a4.5 4.5 0 014.5 4.5v3"
      />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  );
}

function EuroIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5H5.25m2.25 3H5.25M9 10.5h3.75M9 13.5h3.75"
      />
    </svg>
  );
}

function PropertyTypeIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function SeaViewIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 16.5c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 20c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"
      />
    </svg>
  );
}

function GardenIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M12 12.75c-2.5 0-4.5-2-4.5-4.5 0-2 1.5-3.5 3-4.5.5-.3 1-.5 1.5-.5s1 .2 1.5.5c1.5 1 3 2.5 3 4.5 0 2.5-2 4.5-4.5 4.5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 14.25c-1.5 0-2.75-1.25-2.75-2.75 0-1.25 1-2.25 2-3 .33-.25.67-.4 1-.5M17.25 14.25c1.5 0 2.75-1.25 2.75-2.75 0-1.25-1-2.25-2-3-.33-.25-.67-.4-1-.5"
      />
    </svg>
  );
}

function FloorIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 12h6M9 17.25h6" />
    </svg>
  );
}

function YearIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function EnergyIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function MountainViewIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 20l5-10 4 6 5-8 6 12H2z" />
    </svg>
  );
}

function PanoramicViewIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PoolIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 17c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7V3M17 7V3M7 12V7M17 12V7" />
    </svg>
  );
}

function TerraceIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M18.364 5.636l-1.06 1.06M21 12h-1.5M18.364 18.364l-1.06-1.06M12 21v-1.5M5.636 18.364l1.06-1.06M3 12h1.5M5.636 5.636l1.06 1.06" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M6 17h12v4H6z" />
    </svg>
  );
}

function BalconyIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6M4 12V6a2 2 0 012-2h12a2 2 0 012 2v6M8 12v8M12 12v8M16 12v8" />
    </svg>
  );
}

function ParkingIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25m-2.25 0h-2.25m0 0v6m0-6h2.25m0 6h-2.25" />
    </svg>
  );
}

function GarageIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 21V6l8.25-4.5L20.25 6v15M7.5 11.25h9M7.5 14.25h9M7.5 17.25h9" />
    </svg>
  );
}

function FireplaceIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 003.75-3.75c0-1.452-.516-2.78-1.5-3.75-1.125.75-2.25.75-3 0-.375.75-.75 1.5-.75 2.25A3.75 3.75 0 0012 18z" />
    </svg>
  );
}

function AirConditioningIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9.75h15a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5h-15a1.5 1.5 0 01-1.5-1.5v-6a1.5 1.5 0 011.5-1.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.75v3M12 4.5v5.25M18 6.75v3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 14.25h2M10.5 14.25h3M16 14.25h2" />
    </svg>
  );
}

function ElevatorIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5V3.75H3.75zM12 3.75v16.5M8.25 8.25l-2.25 2.25 2.25 2.25M15.75 11.25l2.25 2.25-2.25 2.25" />
    </svg>
  );
}

function RenovatedIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}
