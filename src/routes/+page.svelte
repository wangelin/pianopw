<script>
	import '../app.css';
	import App from './App.svelte';
</script>

<svelte:boundary>
	<<App /> />

	{#snippet failed(error)}
		<p>Oops! {error.message}</p>
	{/snippet}
</svelte:boundary>
