import { useCallback, useEffect, useState } from "react";
import { fetchPayoutBalance } from "../../Api";
import { showServerErrorToast } from "../../utils/toast";
import SimpleCardsSection from "../shared/SimpleCardsSection";

function Balance() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBalance = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchPayoutBalance();
      setCards(response.data?.cards || []);
    } catch (error) {
      setCards([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  return (
    <SimpleCardsSection
      title="Payout Balance"
      subtitle="Manage wallet liquidity and transfer operations."
      cards={cards}
      loading={loading}
      actions={
        <div className="header-actions">
          <button type="button" className="primary-btn">
            Transfer Funds
          </button>
          <button type="button" className="outline-btn">
            Withdraw
          </button>
        </div>
      }
    />
  );
}

export default Balance;
