# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A broad professional audience evaluating Nasrallah Rafi's work, projects, and ways to make contact. Recruiters and hiring managers are included, but are not the sole audience.

## Product Purpose

Present Rafi's professional portfolio and let visitors explore the work through the Ask Rafi chat widget. Success means visitors can find relevant project evidence and contact information without friction.

## Operating Context

The static frontend is hosted on GitHub Pages. Its chatbot sends requests to an Azure hosted backend through `api.nasrallahrafi.me`, which is proxied by Cloudflare.

## Capabilities and Constraints

- The existing portfolio and chat widget are in use. Preserve their established layout and interaction while adding security controls.
- Chat runs in English and French and is available on multiple portfolio pages.
- Browser traffic must pass a Cloudflare Turnstile check before using the AI backend once that protection is enabled.

## Brand Commitments

- Existing identity: Nasrallah Rafi and the Ask Rafi assistant.
- This is a brand surface in the user's premium web presence lane for content creators and local businesses under Designs of Desire studio. It must not drift into a generic SaaS or corporate template.

## Product Principles

1. Keep the person and their documented work central.
2. Make project evidence and contact routes easy to reach.
3. Protect the visitor experience from chat abuse without changing the portfolio's visual identity.
