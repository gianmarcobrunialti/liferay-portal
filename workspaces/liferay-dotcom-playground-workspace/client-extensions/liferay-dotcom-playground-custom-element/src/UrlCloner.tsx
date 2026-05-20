import ClayAlert from '@clayui/alert';
import ClayButton from '@clayui/button';
import ClayForm, {ClayInput} from '@clayui/form';
import ClayLoadingIndicator from '@clayui/loading-indicator';
import React, {useState} from 'react';

interface Props {
	cloneEndpoint: string;
}

type Status =
	| {kind: 'idle'}
	| {kind: 'submitting'}
	| {kind: 'success'; friendlyURL: string}
	| {kind: 'error'; message: string};

declare global {
	interface Window {
		Liferay?: {
			ThemeDisplay?: {
				getScopeGroupId?: () => string;
			};
			authToken?: string;
		};
	}
}

export function UrlCloner({cloneEndpoint}: Props) {
	const [sourceUrl, setSourceUrl] = useState('');
	const [status, setStatus] = useState<Status>({kind: 'idle'});

	async function onSubmit(event: React.FormEvent) {
		event.preventDefault();

		const trimmed = sourceUrl.trim();

		if (!trimmed) return;

		const targetSiteId = window.Liferay?.ThemeDisplay?.getScopeGroupId?.();

		if (!targetSiteId) {
			setStatus({kind: 'error', message: 'Unable to resolve playground site.'});
			return;
		}

		setStatus({kind: 'submitting'});

		try {
			const response = await fetch(cloneEndpoint, {
				body: JSON.stringify({sourceUrl: trimmed, targetSiteId: Number(targetSiteId)}),
				headers: {
					'Content-Type': 'application/json',
					...(window.Liferay?.authToken
						? {'x-csrf-token': window.Liferay.authToken}
						: {}),
				},
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}

			const body = await response.json();

			setStatus({kind: 'success', friendlyURL: body.friendlyURL});
		} catch (error) {
			setStatus({
				kind: 'error',
				message: error instanceof Error ? error.message : 'Clone failed.',
			});
		}
	}

	return (
		<div className="playground-cloner">
			<h2 className="playground-cloner__title">Clone a Liferay page</h2>
			<p className="playground-cloner__hint">
				Paste a page URL from this Liferay instance. We'll copy it into your
				playground so you can edit it safely.
			</p>
			<ClayForm onSubmit={onSubmit}>
				<ClayForm.Group>
					<ClayInput
						aria-label="Source URL"
						disabled={status.kind === 'submitting'}
						onChange={(event) => setSourceUrl(event.target.value)}
						placeholder="https://www.liferay.com/products/dxp"
						type="url"
						value={sourceUrl}
					/>
				</ClayForm.Group>
				<ClayButton disabled={status.kind === 'submitting'} type="submit">
					{status.kind === 'submitting' ? (
						<ClayLoadingIndicator small />
					) : (
						'Clone into my playground'
					)}
				</ClayButton>
			</ClayForm>
			{status.kind === 'success' && (
				<ClayAlert displayType="success" title="Cloned">
					Page available at{' '}
					<a href={status.friendlyURL}>{status.friendlyURL}</a>.
				</ClayAlert>
			)}
			{status.kind === 'error' && (
				<ClayAlert displayType="danger" title="Clone failed">
					{status.message}
				</ClayAlert>
			)}
		</div>
	);
}
