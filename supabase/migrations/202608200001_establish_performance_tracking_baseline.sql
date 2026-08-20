begin;

update public.client_status_history
  as history
set
  started_at = (
    (
      (
        history.created_at
        at time zone 'Africa/Lagos'
      )::date + 1
    )::timestamp
    at time zone 'Africa/Lagos'
  )
from public.clients
  as client
where
  history.client_id = client.id
  and history.status = client.status
  and history.ended_at is null
  and history.started_at =
    client.created_at
  and history.created_at >
    history.started_at;

commit;
