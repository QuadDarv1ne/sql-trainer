#!/bin/bash
# Configure dual remote push to both GitHub and GitVerse
# Usage: bash setup-remotes.sh (after cloning the repo)

echo "Configuring remotes..."

# Remove default origin if exists
git remote remove origin 2>/dev/null
git remote remove gitverse 2>/dev/null

# Add primary remote (GitHub)
git remote add origin git@github.com:dupleymi-aup/sql-trainer.git

# Add secondary remote (GitVerse)
git remote add gitverse git@gitverse.ru:dupleymi-amp/sql-trainer.git

# Configure origin to push to BOTH repositories
git remote set-url --add --push origin git@github.com:dupleymi-aup/sql-trainer.git
git remote set-url --add --push origin git@gitverse.ru:dupleymi-amp/sql-trainer.git

echo "Remotes configured:"
git remote -v
echo ""
echo "Done! Now 'git push origin <branch>' will push to both GitHub and GitVerse."
