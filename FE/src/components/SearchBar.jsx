import { FiSearch } from "react-icons/fi";

function SearchBar({ value, onChange, placeholder = "Search" }) {
  return (
    <label className="search-wrap" aria-label={placeholder}>
      <FiSearch />
      <input
        type="search"
        name="table-search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export default SearchBar;
