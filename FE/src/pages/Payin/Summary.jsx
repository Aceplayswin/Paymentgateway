import { useCallback, useEffect, useState } from "react";
import { fetchPayinSummary } from "../../Api";
import { showServerErrorToast } from "../../utils/toast";
import SimpleCardsSection from "../shared/SimpleCardsSection";

function Summary() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchPayinSummary();
      setCards(response.data?.cards || []);
    } catch (error) {
      setCards([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <SimpleCardsSection
      title="Payin Summary"
      subtitle="High-level success rates, settlement health, and volume analytics."
      cards={cards}
      loading={loading}
    />
  );
}

export default Summary;
