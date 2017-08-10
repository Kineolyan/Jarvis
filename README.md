# Jarvis
The main idea is to create an assistant for common geeky tasks.

This will not be a super something you ca talk to, bacause, really, do you picture yourself talking at home to your computer to make him do something.

This focus instead on automating common tasks, such a compiling, testing and then commiting, pushing and publishing a project. It should be able to learn from your input what to do, and have capabilities for recovering when something goes wrong - git pull failed because of uncommited files !, then stash and retry.

# Architecture

`ExecDefinition`s are the basics, it says what to do in which directory.
Running `ExecDefinition`s create `Process`es. `Process`es can be recorded by a `JobManager`, to be notified on completion, look at the logs, ...
A `Program` consists of various steps to successfully run consecutively. Once a step fails, one can restart from there provided manual correction.
A `RecoveryManager` can attempt automatic fixes for failed `Process`es. For a `Program`, one can specify the various recovery steps to perform, in a given order.ß
