begin;

alter table public.candidate_documents drop constraint if exists candidate_documents_review_needs_file;

commit;
