import { Search, ChevronDown } from 'lucide-react';
import Image from 'next/image';

// Define types for search results
type SearchResultType = {
  id: number;
  title: string;
  description: string;
  image: string;
  type: string;
};

// Define type for grade options
type GradeOptionType = {
  id: number;
  label: string;
  value: string;
};

// Placeholder search agent actions
const searchAgentActions = [
  "Looking through PBSMedia, IXL, Khan Academy, and 4 other sites...",
  "Looking through 14 results on PBSMedia...",
  "Found 3 high quality resources on PBSMedia...",
  "Looking..."
];

// Fixture data for grade options
const gradeOptions: GradeOptionType[] = [
  { id: 0, label: "All Grades", value: "all" },
  { id: 1, label: "Kindergarten", value: "K" },
  { id: 2, label: "Grade 1", value: "1" },
  { id: 3, label: "Grade 2", value: "2" },
  { id: 4, label: "Grade 3", value: "3" },
  { id: 5, label: "Grade 4", value: "4" },
  { id: 6, label: "Grade 5", value: "5" },
  { id: 7, label: "Grade 6", value: "6" },
  { id: 8, label: "Grade 7", value: "7" },
  { id: 9, label: "Grade 8", value: "8" },
  { id: 10, label: "Grade 9", value: "9" },
  { id: 11, label: "Grade 10", value: "10" },
  { id: 12, label: "Grade 11", value: "11" },
  { id: 13, label: "Grade 12", value: "12" },
];

// Fixture data for search results
const searchResults: SearchResultType[] = [
  {
    id: 1,
    title: "Volcanic Eruptions and Their Impact on Climate",
    description: "Learn about how volcanic eruptions affect global climate patterns through the release of ash, gases, and aerosols into the atmosphere.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRa0tiyaniMsAvPtpe3YLePWvpddUHDv6Qz8A&s",
    type: "Video"
  },
  {
    id: 2,
    title: "The Formation and Structure of Volcanoes",
    description: "Discover how volcanoes form and the different types of volcanic structures found around the world, from shield volcanoes to stratovolcanoes.",
    image: "https://www.thoughtco.com/thmb/RVHYNhzVuhQIGPETDM42VukXVsg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/an-active-volcano-spews-out-hot-red-lava-and-smoke--140189201-5b8e85b046e0fb00500d0e23.jpg",
    type: "Interactive Lesson"
  },
];

// Individual search result component
const SearchResult = ({ title, description, image, type }: { title: string; description: string; image: string; type: string }) => {
  return (
    <div className="flex border rounded-lg overflow-hidden mb-4 bg-white">
      <div className="w-1/4 min-w-[120px] max-w-[180px] relative">
        <img 
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex-1">
        <div className="text-xs text-blue-600 font-medium mb-1">{type}</div>
        <h3 className="font-medium text-base mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

// Search results container component
const SearchResults = ({ results }: { results: SearchResultType[] }) => {
  return (
    <div className="w-[600px] max-w-full px-4 mb-10">
      <h2 className="text-xl font-medium mb-4">Results</h2>
      <div>
        {results.map((result) => (
          <SearchResult
            key={result.id}
            title={result.title}
            description={result.description}
            image={result.image}
            type={result.type}
          />
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <div className="flex flex-col items-center w-[600px] max-w-full mx-auto">
      <div className="px-4 flex-1 w-full mb-2">
        {/* Search bar - alone on top row */}
        <div className="flex items-center bg-[#f2f2f7] rounded-lg shadow-sm border border-[#e5e5ea] transition-all duration-200 focus-within:ring-1 focus-within:ring-[#8e8e93] overflow-hidden mb-2">
          <input
            type="text"
            placeholder="Search..."
            defaultValue="Volcanoes"
            className="flex-grow h-12 pl-4 bg-transparent text-base text-[#1c1c1e] placeholder:text-[#8e8e93] focus:outline-none"
          />
          <button
            type="submit"
            className="bg-[#1c1c1e] text-white w-12 h-12 flex items-center justify-center hover:bg-[#3a3a3c] transition duration-200"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
        
        {/* Grade Selector - moved below search bar, aligned left, smaller */}
        <div className="flex justify-start mb-6">
          <div className="relative">
            <select 
              defaultValue="all"
              className="appearance-none h-8 pl-3 pr-8 bg-[#f2f2f7] rounded-md text-sm text-[#1c1c1e] border border-[#e5e5ea] focus:outline-none focus:ring-1 focus:ring-[#8e8e93]"
            >
              {gradeOptions.map((grade) => (
                <option key={grade.id} value={grade.value}>
                  {grade.label}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-3 h-3 text-[#8e8e93]" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Search agent actions area */}
      <div className="w-[600px] max-w-full px-4 mb-10">
        <div className="rounded-lg border border-[#e5e5ea] bg-white p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-3 text-[#1c1c1e]">Astral is looking for resources...</h3>
          <div className="space-y-2.5">
            {searchAgentActions.map((action, index) => (
              <div key={index} className="text-[#3a3a3c] text-sm border-l-2 border-gray-200 pl-3 py-0.5">
                {action}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Search results section */}
      <SearchResults results={searchResults} />
    </div>
  );
}