import { Transactions } from './utils';

const fetchAllNotes = async (auth_token: string) => {
  let response = await window.fetch('/api/notes', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Authorization': "Bearer " + auth_token,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};

async function callProcessTransactionsApi(authToken: string, transactions: Transactions) {
  return await fetch("/api/notes/process_transactions", {
    method: "POST", credentials: 'include',
    headers: {
      'Authorization': "Bearer " + authToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transactions)
  });
}

const serverApis = {
  fetchAllNotes: fetchAllNotes,
  callProcessTransactionsApi: callProcessTransactionsApi
}

export default serverApis;
