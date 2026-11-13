'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadCandidateDocuments } from '@/lib/candidateDocumentActions';
import type { CandidateDocumentRow } from '@/lib/candidateDocuments';

/**
 * candidate_documents rows for one candidate. The staff page loads them once
 * and hands the same rows to the document list and the summary card, so the
 * two can never disagree.
 */
export function useCandidateDocuments(candidateId: string) {
  const [rows, setRows] = useState<CandidateDocumentRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const result = await loadCandidateDocuments(candidateId);
    setRows(result.rows);
    setError(result.error);
    setLoaded(true);
  }, [candidateId]);

  useEffect(() => {
    let alive = true;
    loadCandidateDocuments(candidateId).then((result) => {
      if (!alive) return;
      setRows(result.rows);
      setError(result.error);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [candidateId]);

  return { rows, loaded, error, reload };
}
